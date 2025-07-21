import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import type { Message, FileUpload } from '../types';

export const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState<FileUpload | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null); // Add this line
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(messages.reverse());
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    if (/mobile/i.test(userAgent)) return '[MOB]';
    if (/tablet/i.test(userAgent)) return '[TAB]';
    return '[DSK]';
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageData = {
      userId: user.uid,
      userEmail: user.email || '',
      userName: user.displayName || 'Anonymous',
      userPhoto: user.photoURL || '',
      text: newMessage,
      timestamp: serverTimestamp(),
      deviceInfo: getDeviceInfo(),
    };

    setNewMessage('');
    try {
      await addDoc(collection(db, 'messages'), messageData);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageData.text);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    const MAX_SIZE = 30 * 1024 * 1024;
    const isLarge = file.size > MAX_SIZE;
    
    const timestamp = Date.now();
    const path = isLarge 
      ? `temp-files/${user.uid}/${timestamp}-${file.name}`
      : `files/${user.uid}/${timestamp}-${file.name}`;

    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploadingFile({ file, progress: 0 });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadingFile(prev => prev ? { ...prev, progress } : null);
      },
      (error) => {
        console.error('Upload error:', error);
        setUploadingFile(prev => prev ? { ...prev, error: error.message } : null);
        setTimeout(() => setUploadingFile(null), 5000);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        const messageData = {
          userId: user.uid,
          userEmail: user.email || '',
          userName: user.displayName || 'Anonymous',
          userPhoto: user.photoURL || '',
          fileUrl: downloadURL,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          timestamp: serverTimestamp(),
          deviceInfo: getDeviceInfo(),
        };

        await addDoc(collection(db, 'messages'), messageData);
        setUploadingFile(null);

        if (isLarge) {
          setTimeout(() => {
            deleteObject(storageRef).catch(console.error);
          }, 10 * 24 * 60 * 60 * 1000);
        }
      }
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };

  const formatTime = (timestamp: Timestamp | null) => {
  if (!timestamp) return 'now';
  
  try {
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch {  // Remove the unused 'error' parameter
    return 'now';
  }
    };

    const handleCopyMessage = (textToCopy: string, messageId: string) => {
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedMessageId(messageId);
        setTimeout(() => {
            setCopiedMessageId(null);
        }, 1500); // Keep the visual feedback for 1.5 seconds
        }).catch(err => {
        console.error('Failed to copy message: ', err);
        // You could add user-facing error feedback here if you want
        });
    };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-green-400 text-2xl animate-pulse">[LOADING...]</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 text-sm ${
              message.userId === user?.uid ? 'flex-row-reverse' : ''
            }`}
          >
            <div className="w-8 h-8 border border-green-400 flex items-center justify-center text-xs">
              {message.userName?.[0]?.toUpperCase() || '?'}
            </div>
            <div
              className={`flex flex-col max-w-[70%] ${
                message.userId === user?.uid ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-green-600 mb-1">
                <span>{message.userName}</span>
                <span>{message.deviceInfo}</span>
                <span>{message.timestamp ? formatTime(message.timestamp) : 'sending...'}</span>              </div>
              
              {message.text && (
                <div 
                  className={`border ${
                    message.userId === user?.uid
                      ? 'border-cyan-400 text-cyan-400'
                      : 'border-green-400 text-green-400'
                  } bg-black/50 px-3 py-2 cursor-pointer transition-all ${
                    copiedMessageId === message.id ? 'bg-green-400/30 border-green-400' : ''
                  }`}
                  onClick={() => handleCopyMessage(message.text || '', message.id)}
                  title="Click to copy"
                >
                  {message.text}
                </div>
              )}
              
              {message.fileUrl && (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 border ${
                    message.userId === user?.uid
                      ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400/10'
                      : 'border-green-400 text-green-400 hover:bg-green-400/10'
                  } bg-black/50 p-3 block transition-colors`}
                  onContextMenu={(e) => {
                    if ('ontouchstart' in window) {
                      e.preventDefault();
                      window.open(message.fileUrl, '_blank');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">[📎]</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">
                        {message.fileName}
                      </p>
                      <p className="text-xs opacity-70">
                        {formatFileSize(message.fileSize || 0)}
                      </p>
                    </div>
                  </div>
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload progress */}
      {uploadingFile && (
        <div className="px-4 py-2 border-t border-green-400 text-green-400">
          <div className="flex items-center gap-2 text-sm">
            <span>[UPLOADING] {uploadingFile.file.name}</span>
            <div className="flex-1 border border-green-400 h-2">
              <div
                className="bg-green-400 h-full transition-all"
                style={{ width: `${uploadingFile.progress}%` }}
              />
            </div>
            <span>{Math.round(uploadingFile.progress)}%</span>
          </div>
          {uploadingFile.error && (
            <p className="text-xs text-red-400 mt-1">[ERROR] {uploadingFile.error}</p>
          )}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={sendMessage} className="p-4 border-t border-green-400">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors"
            disabled={!!uploadingFile}
          >
            [+]
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={!!uploadingFile}
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="&gt; ENTER MESSAGE..."
            className="flex-1 px-3 py-2 bg-black border border-green-400 text-green-400 placeholder-green-600 focus:outline-none focus:border-glow"
            disabled={!!uploadingFile}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !!uploadingFile}
            className="px-4 py-2 border border-green-400 text-green-400 hover:bg-green-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [SEND]
          </button>
        </div>
      </form>
    </div>
  );
};