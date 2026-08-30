/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useSocket } from "@/providers/SocketProvider";
import {
  getMyConversations,
  getOrCreateConversation,
  getConversationMessages,
  sendChatMessage,
  sendChatMessageWithFile,
  shareMedicalRecordInChat,
  getConversationSharedDocuments,
} from "@/services/chat.services";
import { getMyMedicalRecords } from "@/services/medicalRecord.services";
import { initiateCall } from "@/services/call.services";
import { getAllDoctors } from "@/services/doctor.services";
import { getAllPatients } from "@/services/patient.services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Send,
  Plus,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Stethoscope,
  Video,
  Check,
  CheckCheck,
  X,
  Download,
  Eye,
  Loader2,
  FolderOpen,
  Calendar,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ZoomIn,
  HeartPulse,
  MessageSquarePlus,
  UserPlus,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function AdvancedClinicalChatPage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryConvId = searchParams.get("conversationId");
  const queryDoctorId = searchParams.get("doctorId");
  const queryPatientId = searchParams.get("patientId");

  // Conversations & Active Selection
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(queryConvId || null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // New Chat Modal State
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [startingChat, setStartingChat] = useState(false);

  // Messages & Pagination
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgInput, setMsgInput] = useState("");
  const [sending, setSending] = useState(false);

  // Online Presence & Typing
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // File Upload Staging
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Medical Record Sharing Modal
  const [isShareRecordOpen, setIsShareRecordOpen] = useState(false);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [recordNote, setRecordNote] = useState("");
  const [sharingRecord, setSharingRecord] = useState(false);

  // Shared Documents Drawer
  const [isDocumentsDrawerOpen, setIsDocumentsDrawerOpen] = useState(false);
  const [sharedDocsData, setSharedDocsData] = useState<any>(null);
  const [loadingSharedDocs, setLoadingSharedDocs] = useState(false);

  // Image Lightbox
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Active Conversation Object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || null;
  }, [conversations, activeConvId]);

  // Recipient User ID & Details
  const partnerDetails = useMemo(() => {
    if (!activeConversation || !user) return null;
    const isUserDoctor = user.role === "DOCTOR";
    const partner = isUserDoctor ? activeConversation.patient : activeConversation.doctor;
    const partnerUser = partner?.user;
    const isOnline = partnerUser?.id ? onlineUsers.has(partnerUser.id) : false;

    return {
      partner,
      partnerUser,
      isOnline,
      name: isUserDoctor ? partner?.name : `Dr. ${partner?.name?.replace(/^Dr\.?\s*/i, "")}`,
      photo: partner?.profilePhoto || partnerUser?.image,
      role: isUserDoctor ? "Patient" : "Doctor",
      subtitle: isUserDoctor
        ? partner?.contactNumber || partner?.email
        : `${partner?.designation || "Specialist"} • ${partner?.qualification || "MBBS"}`,
      workplace: partner?.currentWorkingPlace,
      bloodGroup: (partner as any)?.patientHealthData?.bloodGroup,
    };
  }, [activeConversation, user, onlineUsers]);

  // 1. Initial Conversations Fetch & Auto-create if doctorId/patientId in query
  useEffect(() => {
    let isMounted = true;

    const fetchConversations = async () => {
      try {
        setLoadingConvs(true);
        const res = await getMyConversations();
        let convList = res.data || [];

        // If doctorId or patientId is in URL query parameters, get or create conversation
        if (queryDoctorId || queryPatientId) {
          try {
            const createRes = await getOrCreateConversation({
              doctorId: queryDoctorId || undefined,
              patientId: queryPatientId || undefined,
            });
            if (createRes?.data) {
              const targetConv = createRes.data;
              const exists = convList.some((c: any) => c.id === targetConv.id);
              if (!exists) {
                convList = [targetConv, ...convList];
              }
              if (isMounted) {
                setActiveConvId(targetConv.id);
              }
            }
          } catch (createErr: any) {
            console.error("Auto getOrCreateConversation error:", createErr);
          }
        } else if (queryConvId) {
          if (isMounted) setActiveConvId(queryConvId);
        } else if (convList.length > 0 && !activeConvId) {
          if (isMounted) setActiveConvId(convList[0].id);
        }

        if (isMounted) {
          const uniqueConvs = Array.from(new Map(convList.map((c: any) => [c.id, c])).values());
          setConversations(uniqueConvs);
        }
      } catch (err: any) {
        toast.error("Failed to load conversations");
      } finally {
        if (isMounted) {
          setLoadingConvs(false);
        }
      }
    };

    fetchConversations();

    return () => {
      isMounted = false;
    };
  }, [queryConvId, queryDoctorId, queryPatientId]);

  // 2. Fetch Messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    const fetchMessages = async () => {
      setLoadingMsgs(true);
      try {
        const res = await getConversationMessages(activeConvId, { limit: 50, sortOrder: "asc" });
        setMessages(res.data || []);

        if (socket && isConnected) {
          (socket as any).emit("chat:join-conversation", { conversationId: activeConvId });
          (socket as any).emit("chat:read", { conversationId: activeConvId });
        }

        // Reset unread count in local state
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, unreadCount: 0 } : c))
        );
      } catch {
        toast.error("Failed to load messages");
      } finally {
        setLoadingMsgs(false);
      }
    };

    fetchMessages();

    return () => {
      if (socket && isConnected) {
        (socket as any).emit("chat:leave-conversation", { conversationId: activeConvId });
      }
    };
  }, [activeConvId, socket, isConnected]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Safe deduplicating message upsert helper
  const upsertMessage = (prev: any[], newMsg: any) => {
    if (!newMsg) return prev;
    const index = prev.findIndex(
      (m) =>
        (newMsg.id && m.id === newMsg.id) ||
        (newMsg.tempId && m.tempId === newMsg.tempId) ||
        (m.tempId && newMsg.id === m.tempId)
    );
    if (index !== -1) {
      const updated = [...prev];
      updated[index] = { ...prev[index], ...newMsg };
      return updated;
    }
    return [...prev, newMsg];
  };

  // 4. Socket Listeners for Real-time Messaging, Read Receipts, Typing & Presence
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncomingMessage = (msg: any) => {
      if (msg.conversationId === activeConvId) {
        setMessages((prev) => upsertMessage(prev, msg));
        (socket as any).emit("chat:read", { conversationId: activeConvId });
      }

      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === msg.conversationId) {
            const isCurrent = c.id === activeConvId;
            return {
              ...c,
              lastMessageAt: msg.createdAt,
              lastMessage: msg,
              unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
        return updated.sort(
          (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
      });
    };

    const handleChatRead = (payload: any) => {
      if (payload.conversationId === activeConvId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === user?.id ? { ...m, status: "READ" } : m
          )
        );
      }
    };

    const handleTyping = (payload: any) => {
      if (payload.conversationId === activeConvId && payload.senderId !== user?.id) {
        setTypingUsers((prev) => ({ ...prev, [payload.senderId]: true }));
      }
    };

    const handleStopTyping = (payload: any) => {
      if (payload.conversationId === activeConvId) {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[payload.senderId];
          return updated;
        });
      }
    };

    const handlePresenceOnline = (payload: any) => {
      setOnlineUsers((prev) => new Set(prev).add(payload.userId));
    };

    const handlePresenceOffline = (payload: any) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(payload.userId);
        return updated;
      });
    };

    (socket as any).on("chat:message", handleIncomingMessage);
    (socket as any).on("chat:read", handleChatRead);
    (socket as any).on("chat:typing", handleTyping);
    (socket as any).on("chat:stop-typing", handleStopTyping);
    (socket as any).on("presence:online", handlePresenceOnline);
    (socket as any).on("presence:offline", handlePresenceOffline);

    return () => {
      (socket as any).off("chat:message", handleIncomingMessage);
      (socket as any).off("chat:read", handleChatRead);
      (socket as any).off("chat:typing", handleTyping);
      (socket as any).off("chat:stop-typing", handleStopTyping);
      (socket as any).off("presence:online", handlePresenceOnline);
      (socket as any).off("presence:offline", handlePresenceOffline);
    };
  }, [socket, isConnected, activeConvId, user]);

  // Handle Typing Debounce Trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsgInput(e.target.value);

    if (!socket || !isConnected || !partnerDetails?.partnerUser?.id) return;

    (socket as any).emit("chat:typing", {
      recipientId: partnerDetails.partnerUser.id,
      conversationId: activeConvId,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      (socket as any).emit("chat:stop-typing", {
        recipientId: partnerDetails.partnerUser.id,
        conversationId: activeConvId,
      });
    }, 2000);
  };

  // 5. Send Text or File Message with Instant Optimistic UI (WhatsApp/Messenger style)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConvId || (!msgInput.trim() && !selectedFile)) return;

    const tempId = "temp-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const content = msgInput.trim();
    const currentFile = selectedFile;
    const currentPreview = filePreviewUrl;

    // 1. INSTANT: Clear input and file state immediately (0ms)
    setMsgInput("");
    setSelectedFile(null);
    setFilePreviewUrl(null);

    // Stop typing indicator immediately
    if (socket && isConnected && partnerDetails?.partnerUser?.id) {
      (socket as any).emit("chat:stop-typing", {
        recipientId: partnerDetails.partnerUser.id,
        conversationId: activeConvId,
      });
    }

    // 2. INSTANT: Optimistic message appended directly to state
    const optimisticMsg: any = {
      id: tempId,
      tempId,
      conversationId: activeConvId,
      senderId: user?.id,
      sender: user,
      content,
      messageType: currentFile ? (currentFile.type.startsWith("image/") ? "IMAGE" : "DOCUMENT") : "TEXT",
      status: "SENT",
      createdAt: new Date().toISOString(),
      attachments: currentFile
        ? [
            {
              id: "att-" + tempId,
              fileName: currentFile.name,
              fileSize: currentFile.size,
              fileType: currentFile.type,
              fileUrl: currentPreview || "",
            },
          ]
        : [],
    };

    // Update messages feed and left conversation preview immediately
    setMessages((prev) => [...prev, optimisticMsg]);
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConvId
          ? { ...c, lastMessageAt: optimisticMsg.createdAt, lastMessage: optimisticMsg }
          : c
      );
      return updated.sort(
        (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
      );
    });

    // 3. BACKGROUND: Fire network request asynchronously without blocking UI
    try {
      if (currentFile) {
        const formData = new FormData();
        formData.append("file", currentFile);
        formData.append("content", content);
        formData.append("tempId", tempId);

        const res = await sendChatMessageWithFile(activeConvId, formData);
        if (res.data) {
          setMessages((prev) => upsertMessage(prev, res.data));
        }
      } else {
        if (socket && isConnected && partnerDetails?.partnerUser?.id) {
          const payload = {
            recipientId: partnerDetails.partnerUser.id,
            conversationId: activeConvId,
            content,
            tempId,
          };
          (socket as any).emit("chat:send", payload, (ack: any) => {
            if (ack.success && ack.data) {
              setMessages((prev) => upsertMessage(prev, ack.data));
            } else {
              toast.error(ack.error || "Failed to deliver message");
              setMessages((prev) =>
                prev.map((m) =>
                  m.tempId === tempId ? { ...m, status: "FAILED" } : m
                )
              );
            }
          });
        } else {
          // Fallback to HTTP if socket is not available
          const payload = {
            content,
            tempId,
            messageType: "TEXT",
          };
          const res = await sendChatMessage(activeConvId, payload);
          if (res.data) {
            setMessages((prev) => upsertMessage(prev, { ...res.data, tempId }));
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to deliver message");
    }
  };

  // Handle File Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File size cannot exceed 25MB");
      return;
    }

    setSelectedFile(file);
    if (isImage) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
  };

  // 6. Share Medical Record in Chat
  const handleOpenShareRecordModal = async () => {
    setIsShareRecordOpen(true);
    setLoadingRecords(true);
    try {
      const res = await getMyMedicalRecords();
      setPatientRecords(res.data || []);
    } catch {
      toast.error("Failed to load medical records");
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleConfirmShareRecord = async () => {
    if (!activeConvId || !selectedRecordId) {
      toast.error("Please select a medical record to share");
      return;
    }

    setSharingRecord(true);
    try {
      const res = await shareMedicalRecordInChat(activeConvId, {
        medicalRecordId: selectedRecordId,
        note: recordNote || "Shared a previous medical record",
      });
      if (res.data) {
        setMessages((prev) => upsertMessage(prev, res.data));
      }
      setIsShareRecordOpen(false);
      setSelectedRecordId(null);
      setRecordNote("");
      toast.success("Medical record shared with doctor");
    } catch (err: any) {
      toast.error(err.message || "Failed to share medical record");
    } finally {
      setSharingRecord(false);
    }
  };

  // 7. Open Shared Clinical Documents Drawer
  const handleToggleDocumentsDrawer = async () => {
    if (!isDocumentsDrawerOpen && activeConvId) {
      setLoadingSharedDocs(true);
      try {
        const res = await getConversationSharedDocuments(activeConvId);
        setSharedDocsData(res.data);
      } catch {
        toast.error("Failed to load shared clinical documents");
      } finally {
        setLoadingSharedDocs(false);
      }
    }
    setIsDocumentsDrawerOpen(!isDocumentsDrawerOpen);
  };

  // 8. Initiate Video Call directly from chat
  const handleStartVideoCall = async () => {
    if (!partnerDetails?.partnerUser?.id) return;
    try {
      const res = await initiateCall({
        receiverId: partnerDetails.partnerUser.id,
        type: "VIDEO",
      });
      toast.success("Initiating video consultation...");
      router.push(`/video-call/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate video call");
    }
  };

  // 9. Open New Chat modal and fetch directory
  const handleOpenNewChat = async () => {
    setIsNewChatOpen(true);
    setLoadingContacts(true);
    try {
      if (user?.role === "PATIENT") {
        const res = await getAllDoctors({ limit: 50 });
        setAvailableContacts(res.data || []);
      } else {
        const res = await getAllPatients({ limit: 50 });
        setAvailableContacts(res.data || []);
      }
    } catch (err: any) {
      toast.error("Failed to load contacts");
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleStartChatWithContact = async (contact: any) => {
    try {
      setStartingChat(true);
      const isDoc = user?.role === "DOCTOR";
      const payload = isDoc
        ? { patientId: contact.id }
        : { doctorId: contact.id };

      const res = await getOrCreateConversation(payload);
      if (res.data) {
        const conv = res.data;
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === conv.id);
          return exists ? prev : [conv, ...prev];
        });
        setActiveConvId(conv.id);
        setIsNewChatOpen(false);
        toast.success(`Chat opened with ${contact.name}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start conversation");
    } finally {
      setStartingChat(false);
    }
  };

  // Filtered Contacts for Modal
  const filteredContacts = useMemo(() => {
    if (!contactSearch) return availableContacts;
    const q = contactSearch.toLowerCase();
    return availableContacts.filter((c) => {
      const isDoc = user?.role === "DOCTOR";
      const name = c.name?.toLowerCase() || "";
      const email = c.email?.toLowerCase() || "";
      const designation = c.designation?.toLowerCase() || "";
      const specialties = (c.specialties || []).map((s: any) => s.specialty?.title?.toLowerCase()).join(" ");
      return name.includes(q) || email.includes(q) || designation.includes(q) || specialties.includes(q);
    });
  }, [availableContacts, contactSearch, user]);

  // Filtered Conversations List
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const isDoc = user?.role === "DOCTOR";
      const partner = isDoc ? c.patient : c.doctor;
      return (
        partner?.name?.toLowerCase().includes(q) ||
        partner?.email?.toLowerCase().includes(q) ||
        partner?.designation?.toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery, user]);

  return (
    <div className="flex h-[calc(100vh-5.5rem)] w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xl">
      {/* ================= LEFT SIDEBAR (CONVERSATION LIST) ================= */}
      <div className="w-full sm:w-80 md:w-96 flex flex-col border-r border-border/60 bg-muted/20 shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between bg-card/60">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <HeartPulse className="size-5 text-primary" />
              Clinical Chat
            </h2>
            <p className="text-xs text-muted-foreground">Doctor ↔ Patient Consultation</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 text-xs font-semibold px-2.5 rounded-lg"
              onClick={handleOpenNewChat}
            >
              <Plus className="size-3.5" />
              <span>New</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border/40 bg-card/30">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors or patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background/80 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {loadingConvs ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <FolderOpen className="size-10 mb-2 opacity-30 text-primary" />
              <p className="text-sm font-medium">No conversations found</p>
              <p className="text-xs opacity-75 mt-1 mb-4 max-w-[200px]">
                {user?.role === "DOCTOR"
                  ? "Start a new conversation with one of your patients."
                  : "Start a conversation or follow up with verified doctors."}
              </p>
              <Button size="sm" onClick={handleOpenNewChat} className="gap-2 text-xs shadow-xs">
                <MessageSquarePlus className="size-4" />
                {user?.role === "DOCTOR" ? "Message Patient" : "Message Doctor"}
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isDoc = user?.role === "DOCTOR";
              const partner = isDoc ? conv.patient : conv.doctor;
              const partnerUser = partner?.user;
              const isActive = conv.id === activeConvId;
              const isOnline = partnerUser?.id ? onlineUsers.has(partnerUser.id) : false;

              const displayName = isDoc
                ? partner?.name || "Patient"
                : `Dr. ${partner?.name?.replace(/^Dr\.?\s*/i, "") || "Doctor"}`;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer transition-all hover:bg-muted/50 ${
                    isActive ? "bg-primary/10 border-l-4 border-primary" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="size-11 border border-border/80 shadow-xs">
                      <AvatarImage src={partner?.profilePhoto || partnerUser?.image || ""} />
                      <AvatarFallback className="bg-primary/15 text-primary font-bold text-sm">
                        {displayName.charAt(displayName.startsWith("Dr.") ? 4 : 0)}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-semibold text-sm truncate text-foreground">{displayName}</h4>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                          {format(new Date(conv.lastMessageAt), "hh:mm a")}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {conv.lastMessage?.messageType === "MEDICAL_RECORD"
                          ? "🩺 [Medical Record]"
                          : conv.lastMessage?.messageType === "IMAGE"
                          ? "📷 [Image]"
                          : conv.lastMessage?.messageType === "DOCUMENT"
                          ? "📄 [Document]"
                          : conv.lastMessage?.content || "Tap to chat"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= MAIN CHAT AREA ================= */}
      {activeConversation && partnerDetails ? (
        <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
          {/* Top Header */}
          <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between bg-card/70 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar className="size-10 border border-primary/20 shadow-xs">
                  <AvatarImage src={partnerDetails.photo || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {partnerDetails.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {partnerDetails.isOnline && (
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{partnerDetails.name}</h3>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold bg-primary/5 text-primary">
                    {partnerDetails.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {partnerDetails.isOnline ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">● Online</span>
                  ) : (
                    partnerDetails.subtitle
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleDocumentsDrawer}
                className="gap-1.5 text-xs font-semibold h-8 border-border/60 hover:bg-primary/10 hover:text-primary"
              >
                <FolderOpen className="size-3.5" />
                <span className="hidden md:inline">Clinical Docs</span>
              </Button>

              <Button
                size="sm"
                onClick={handleStartVideoCall}
                className="gap-1.5 text-xs font-semibold h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                <Video className="size-3.5" />
                <span>Video Call</span>
              </Button>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/10">
            {loadingMsgs ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs">Loading consultation messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <ShieldCheck className="size-6" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">Secure Healthcare Channel</h4>
                <p className="text-xs max-w-sm mt-1">
                  Messages, clinical files, and shared medical records in this consultation are securely protected.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === user?.id;
                const prevMsg = messages[index - 1];
                const showDateDivider =
                  !prevMsg ||
                  new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                return (
                  <React.Fragment key={msg.id || index}>
                    {/* Date Divider */}
                    {showDateDivider && (
                      <div className="flex justify-center my-2">
                        <span className="bg-muted/60 text-muted-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-border/40">
                          {isToday(new Date(msg.createdAt))
                            ? "Today"
                            : isYesterday(new Date(msg.createdAt))
                            ? "Yesterday"
                            : format(new Date(msg.createdAt), "dd MMMM yyyy")}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}>
                      {!isMe && (
                        <Avatar className="size-7 border shrink-0 mb-1">
                          <AvatarImage src={partnerDetails.photo || ""} />
                          <AvatarFallback className="text-[10px] font-bold">
                            {partnerDetails.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-md md:max-w-lg rounded-2xl p-3.5 shadow-xs ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-none"
                            : "bg-card text-card-foreground border border-border/60 rounded-bl-none"
                        }`}
                      >
                        {/* 1. Image Attachments */}
                        {msg.attachments &&
                          msg.attachments.some((a: any) => a.fileType?.startsWith("image/")) && (
                            <div className="mb-2 space-y-2">
                              {msg.attachments
                                .filter((a: any) => a.fileType?.startsWith("image/"))
                                .map((att: any) => (
                                  <div
                                    key={att.id}
                                    onClick={() => setLightboxImageUrl(att.fileUrl)}
                                    className="relative rounded-xl overflow-hidden cursor-pointer group border border-border/40 max-h-60 bg-black/10"
                                  >
                                    <img
                                      src={att.fileUrl}
                                      alt={att.fileName}
                                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                      <ZoomIn className="size-4" /> Click to view
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}

                        {/* 2. Document Attachments */}
                        {msg.attachments &&
                          msg.attachments.some((a: any) => !a.fileType?.startsWith("image/")) && (
                            <div className="mb-2 space-y-2">
                              {msg.attachments
                                .filter((a: any) => !a.fileType?.startsWith("image/"))
                                .map((att: any) => (
                                  <div
                                    key={att.id}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                                      isMe
                                        ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                                        : "bg-muted/40 border-border/60 text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <FileText className="size-5 shrink-0 text-red-500" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold truncate">{att.fileName}</p>
                                        <p className="text-[10px] opacity-75">
                                          {(att.fileSize / 1024).toFixed(1)} KB
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      asChild
                                      className="size-7 p-0 shrink-0 hover:bg-black/10"
                                    >
                                      <a href={att.fileUrl} target="_blank" rel="noopener noreferrer" download>
                                        <Download className="size-3.5" />
                                      </a>
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          )}

                        {/* 3. Medical Record Card */}
                        {msg.medicalRecord && (
                          <div
                            className={`mb-2 p-3 rounded-xl border space-y-1.5 ${
                              isMe
                                ? "bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground"
                                : "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 border-b border-inherit pb-1.5">
                              <Stethoscope className="size-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                Shared Medical Record
                              </span>
                            </div>
                            <div className="text-xs space-y-1">
                              <p>
                                <span className="font-semibold opacity-75">Diagnosis:</span>{" "}
                                {msg.medicalRecord.diagnosis}
                              </p>
                              {msg.medicalRecord.symptoms && (
                                <p>
                                  <span className="font-semibold opacity-75">Symptoms:</span>{" "}
                                  {msg.medicalRecord.symptoms}
                                </p>
                              )}
                              {msg.medicalRecord.advice && (
                                <p className="italic text-[11px] opacity-80">
                                  Advice: {msg.medicalRecord.advice}
                                </p>
                              )}
                              <p className="text-[10px] opacity-70">
                                Recorded on {format(new Date(msg.medicalRecord.createdAt), "dd MMM yyyy")}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Text Message Content */}
                        {msg.content && (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}

                        {/* Message Meta (Time & Status) */}
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMe ? "text-primary-foreground/75" : "text-muted-foreground"
                          }`}
                        >
                          <span>{format(new Date(msg.createdAt || Date.now()), "hh:mm a")}</span>
                          {isMe && (
                            <span>
                              {msg.status === "READ" ? (
                                <CheckCheck className="size-3.5 text-cyan-300" />
                              ) : msg.status === "DELIVERED" ? (
                                <CheckCheck className="size-3.5 opacity-80" />
                              ) : (
                                <Check className="size-3.5 opacity-60" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* Typing Indicator */}
            {Object.keys(typingUsers).length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 animate-pulse">
                <Avatar className="size-6 border">
                  <AvatarImage src={partnerDetails.photo || ""} />
                  <AvatarFallback className="text-[10px]">P</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-full">
                  <span className="size-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] font-medium ml-1.5">{partnerDetails.name} is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Staged File Preview Bar */}
          {selectedFile && (
            <div className="p-3 bg-muted/40 border-t border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {filePreviewUrl ? (
                  <img src={filePreviewUrl} alt="Preview" className="size-12 rounded-lg object-cover border" />
                ) : (
                  <div className="size-12 bg-red-100 dark:bg-red-950 text-red-600 rounded-lg flex items-center justify-center">
                    <FileText className="size-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to send
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreviewUrl(null);
                }}
                className="size-8 p-0 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          {/* Bottom Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 sm:p-4 border-t border-border/60 bg-card flex items-center gap-2 shrink-0"
          >
            {/* Hidden File Inputs */}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => handleFileSelect(e, true)}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileSelect(e, false)}
            />

            {/* Attachment Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-full shrink-0 border-border/60 hover:bg-primary/10 hover:text-primary"
                >
                  <Plus className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 p-1.5 shadow-xl rounded-xl">
                <DropdownMenuItem
                  onClick={() => imageInputRef.current?.click()}
                  className="gap-2.5 py-2 cursor-pointer text-xs font-medium"
                >
                  <ImageIcon className="size-4 text-blue-500" />
                  <span>Send Photo / Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2.5 py-2 cursor-pointer text-xs font-medium"
                >
                  <FileText className="size-4 text-red-500" />
                  <span>Medical Document / PDF</span>
                </DropdownMenuItem>
                {user?.role === "PATIENT" && (
                  <DropdownMenuItem
                    onClick={handleOpenShareRecordModal}
                    className="gap-2.5 py-2 cursor-pointer text-xs font-medium text-emerald-600"
                  >
                    <Stethoscope className="size-4 text-emerald-500" />
                    <span>Share Medical Record</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Input Field */}
            <Input
              placeholder="Type your clinical message or guidance..."
              value={msgInput}
              onChange={handleInputChange}
              className="flex-1 h-10 rounded-full px-4 text-xs sm:text-sm bg-muted/20 border-border/60 focus-visible:ring-primary"
            />

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={sending || (!msgInput.trim() && !selectedFile)}
              className="size-10 rounded-full shrink-0 bg-primary hover:bg-primary/90 text-white shadow-sm"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5 text-muted-foreground">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <HeartPulse className="size-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Doctorly Clinical Communication</h3>
          <p className="text-xs max-w-sm mt-1">
            Select a doctor or patient from the left panel to review consultations, exchange clinical records, and message securely.
          </p>
        </div>
      )}

      {/* ================= RIGHT DRAWER (SHARED CLINICAL DOCUMENTS) ================= */}
      {isDocumentsDrawerOpen && (
        <div className="w-80 sm:w-96 border-l border-border/60 bg-card flex flex-col h-full shrink-0 animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-border/60 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <FolderOpen className="size-4 text-primary" />
              <h3 className="font-bold text-sm">Clinical Documents</h3>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDocumentsDrawerOpen(false)}
              className="size-7 p-0"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingSharedDocs ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : !sharedDocsData || sharedDocsData.totalCount === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <FileText className="size-8 opacity-30 mx-auto mb-2" />
                <p className="text-xs font-semibold">No shared documents yet</p>
                <p className="text-[11px] opacity-75 mt-0.5">Images, PDFs and medical records shared in this chat will appear here.</p>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-3 h-8 text-xs">
                  <TabsTrigger value="all" className="text-xs">All ({sharedDocsData.totalCount})</TabsTrigger>
                  <TabsTrigger value="patient" className="text-xs">Patient</TabsTrigger>
                  <TabsTrigger value="doctor" className="text-xs">Doctor</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-2">
                  {[...sharedDocsData.patientDocuments, ...sharedDocsData.doctorDocuments]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((doc: any, i: number) => (
                      <DocumentItemCard key={i} doc={doc} onImageClick={setLightboxImageUrl} />
                    ))}
                </TabsContent>

                <TabsContent value="patient" className="space-y-2">
                  {sharedDocsData.patientDocuments.map((doc: any, i: number) => (
                    <DocumentItemCard key={i} doc={doc} onImageClick={setLightboxImageUrl} />
                  ))}
                </TabsContent>

                <TabsContent value="doctor" className="space-y-2">
                  {sharedDocsData.doctorDocuments.map((doc: any, i: number) => (
                    <DocumentItemCard key={i} doc={doc} onImageClick={setLightboxImageUrl} />
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: SHARE MEDICAL RECORD ================= */}
      <Dialog open={isShareRecordOpen} onOpenChange={setIsShareRecordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Stethoscope className="size-5 text-primary" />
              Share Medical Record
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select one of your past medical records to securely share with this doctor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-60 overflow-y-auto">
            {loadingRecords ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="size-5 animate-spin text-primary" />
              </div>
            ) : patientRecords.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No previous medical records found on your account.
              </div>
            ) : (
              patientRecords.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecordId(rec.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                    selectedRecordId === rec.id
                      ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                      : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold">{rec.diagnosis}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(rec.createdAt), "dd MMM yyyy")}
                    </span>
                  </div>
                  {rec.symptoms && (
                    <p className="text-muted-foreground text-[11px] truncate">
                      Symptoms: {rec.symptoms}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t">
            <label className="text-xs font-semibold text-foreground">Optional Clinical Note</label>
            <Input
              placeholder="e.g. Please review my previous blood test and diagnosis"
              value={recordNote}
              onChange={(e) => setRecordNote(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsShareRecordOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmShareRecord}
              disabled={sharingRecord || !selectedRecordId}
              className="bg-primary text-white"
            >
              {sharingRecord ? <Loader2 className="size-4 animate-spin" /> : "Share Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: IMAGE LIGHTBOX ================= */}
      {lightboxImageUrl && (
        <Dialog open={!!lightboxImageUrl} onOpenChange={() => setLightboxImageUrl(null)}>
          <DialogContent className="max-w-3xl p-2 bg-black/95 border-none text-white flex flex-col items-center justify-center">
            <div className="relative max-h-[80vh] w-full flex items-center justify-center">
              <img src={lightboxImageUrl} alt="Clinical Image" className="max-h-[78vh] object-contain rounded-lg" />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Button size="sm" variant="outline" asChild className="bg-white/10 hover:bg-white/20 text-white text-xs border-white/20">
                <a href={lightboxImageUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="size-3.5 mr-1.5" /> Download Full Image
                </a>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ================= MODAL: START NEW CHAT ================= */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <MessageSquarePlus className="size-5 text-primary" />
              {user?.role === "DOCTOR" ? "Start Chat with Patient" : "Start Chat with Doctor"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {user?.role === "DOCTOR"
                ? "Select a patient to initiate clinical communication."
                : "Select a verified doctor to ask questions or follow up on your consultation."}
            </DialogDescription>
          </DialogHeader>

          {/* Search Box */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={user?.role === "DOCTOR" ? "Search patient by name or email..." : "Search doctor by name or specialty..."}
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Contact List */}
          <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/20">
            {loadingContacts ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="text-xs">Loading directory...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching contacts found.
              </div>
            ) : (
              filteredContacts.map((contact: any) => {
                const isDoc = user?.role === "DOCTOR";
                const displayName = isDoc ? contact.name : `Dr. ${contact.name?.replace(/^Dr\.?\s*/i, "")}`;
                const subtitle = isDoc
                  ? contact.contactNumber || contact.email
                  : `${contact.designation || contact.specialties?.[0]?.specialty?.title || "Specialist"} • ${contact.qualification || "MBBS"}`;

                return (
                  <div
                    key={contact.id}
                    onClick={() => !startingChat && handleStartChatWithContact(contact)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-10 shrink-0 border border-border/60">
                        <AvatarImage src={contact.profilePhoto || contact.user?.image || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {displayName.charAt(displayName.startsWith("Dr.") ? 4 : 0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-xs text-foreground truncate">{displayName}</h4>
                        <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" disabled={startingChat} className="text-primary hover:bg-primary/10 text-xs h-7 px-2.5 shrink-0 rounded-lg">
                      {startingChat ? <Loader2 className="size-3.5 animate-spin" /> : "Chat"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper Card for Shared Document Drawer
function DocumentItemCard({ doc, onImageClick }: { doc: any; onImageClick: (url: string) => void }) {
  const isImage = doc.fileType?.startsWith("image/");
  const isRecord = doc.type === "MEDICAL_RECORD";

  return (
    <div className="p-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors text-xs space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {isRecord ? (
            <Stethoscope className="size-4 text-emerald-500 shrink-0" />
          ) : isImage ? (
            <ImageIcon className="size-4 text-blue-500 shrink-0" />
          ) : (
            <FileText className="size-4 text-red-500 shrink-0" />
          )}
          <span className="font-bold truncate text-foreground">
            {isRecord ? doc.diagnosis : doc.fileName}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {format(new Date(doc.createdAt), "dd MMM")}
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span>By: {doc.senderName}</span>
        {isImage ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onImageClick(doc.fileUrl)}
            className="h-6 px-2 text-[11px] text-primary"
          >
            <Eye className="size-3 mr-1" /> View
          </Button>
        ) : isRecord ? (
          <Badge variant="outline" className="text-[9px] py-0 px-1 font-semibold">
            Record
          </Badge>
        ) : (
          <Button size="sm" variant="ghost" asChild className="h-6 px-2 text-[11px] text-primary">
            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
              <Download className="size-3 mr-1" /> Download
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
