import { useState } from "react";
import { Search, Mail, MailOpen, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useContactMessages } from "@/hooks/useContactMessages";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const ContactMessageManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { messages, unreadCount, markAsRead, isLoading } = useContactMessages();

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUnread = showUnreadOnly ? !message.is_read : true;
    
    return matchesSearch && matchesUnread;
  });

  const handleMarkAsRead = async (messageId: string) => {
    await markAsRead(messageId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Pesan Kontak
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} Belum Dibaca
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari berdasarkan nama, email, subjek, atau pesan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="gap-2"
            >
              <MailOpen className="w-4 h-4" />
              {showUnreadOnly ? "Tampilkan Semua" : "Hanya Belum Dibaca"}
            </Button>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchTerm || showUnreadOnly
                  ? "Tidak ada pesan yang cocok dengan filter"
                  : "Belum ada pesan kontak"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Pengirim</TableHead>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id} className={!message.is_read ? "bg-muted/30" : ""}>
                      <TableCell>
                        {message.is_read ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Mail className="w-4 h-4 text-primary" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{message.name}</div>
                          <div className="text-sm text-muted-foreground">{message.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={message.subject}>
                          {message.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(message.created_at), { 
                            addSuffix: true, 
                            locale: id 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Lihat
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  Pesan dari {message.name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Nama:</label>
                                    <p className="text-sm text-muted-foreground">{message.name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Email:</label>
                                    <p className="text-sm text-muted-foreground">{message.email}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Subjek:</label>
                                  <p className="text-sm text-muted-foreground">{message.subject}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Pesan:</label>
                                  <div className="bg-muted/50 p-4 rounded-lg mt-2">
                                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>
                                    Dikirim: {formatDistanceToNow(new Date(message.created_at), { 
                                      addSuffix: true, 
                                      locale: id 
                                    })}
                                  </span>
                                  <Badge variant={message.is_read ? "secondary" : "default"}>
                                    {message.is_read ? "Sudah Dibaca" : "Belum Dibaca"}
                                  </Badge>
                                </div>
                                <div className="flex justify-between gap-2 pt-4 border-t">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => window.open(`mailto:${message.email}?subject=Re: ${message.subject}`)}
                                    className="gap-2"
                                  >
                                    <Mail className="w-4 h-4" />
                                    Balas via Email
                                  </Button>
                                  {!message.is_read && (
                                    <Button 
                                      onClick={() => handleMarkAsRead(message.id)}
                                      className="gap-2"
                                    >
                                      <MailOpen className="w-4 h-4" />
                                      Tandai Sudah Dibaca
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {!message.is_read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkAsRead(message.id)}
                            >
                              <MailOpen className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactMessageManagement;