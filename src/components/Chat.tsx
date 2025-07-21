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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to messages
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    if (/mobile/i.test(userAgent)) return '📱 Mobile';
    if (/tablet/i.test(userAgent)) return '📱 Tablet';
    return '💻 Desktop';
  };

  // Send message
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
      setNewMessage(messageData.text); // Restore message on error
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!user) return;

    const MAX_SIZE = 30 * 1024 * 1024; // 30MB
    const isLarge = file.size > MAX_SIZE;
    
    // Create storage path
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
        
        // Send file message
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

        // Schedule deletion for large files
        if (isLarge) {
          setTimeout(() => {
            deleteObject(storageRef).catch(console.error);
          }, 10 * 24 * 60 * 60 * 1000); // 10 days
        }
      }
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Format timestamp
  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.userId === user?.uid ? 'flex-row-reverse' : ''
            }`}
          >
            <img
              src={message.userPhoto}
              alt={message.userName}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <div
              className={`flex flex-col ${
                message.userId === user?.uid ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>{message.userName}</span>
                <span>{message.deviceInfo}</span>
                <span>{formatTime(message.timestamp)}</span>
              </div>
              
              {message.text && (
                <div
                  className={`rounded-lg px-4 py-2 max-w-sm ${
                    message.userId === user?.uid
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  {message.text}
                </div>
              )}
              
              {message.fileUrl && (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 rounded-lg border-2 p-3 block max-w-sm ${
                    message.userId === user?.uid
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                  onContextMenu={(e) => {
                    if ('ontouchstart' in window) {
                      e.preventDefault();
                      window.open(message.fileUrl, '_blank');
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📎</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
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
        <div className="px-4 py-2 bg-blue-50 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm">Uploading {uploadingFile.file.name}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadingFile.progress}%` }}
              />
            </div>
            <span className="text-sm">{Math.round(uploadingFile.progress)}%</span>
          </div>
          {uploadingFile.error && (
            <p className="text-xs text-red-600 mt-1">{uploadingFile.error}</p>
          )}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={!!uploadingFile}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
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
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!uploadingFile}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !!uploadingFile}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};