// home.component.ts
import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { ChatModel } from '../../models/chat.model';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewChecked {
  @ViewChild('chatHistory') private chatHistory!: ElementRef;

  users: UserModel[] = [];
  chats: ChatModel[] = [];
  selectedUserId: string = "";
  selectedUser: UserModel = new UserModel();
  user = new UserModel();
  hub: signalR.HubConnection | undefined;
  message: string = "";
  private shouldScrollToBottom = false;
  isSidebarVisible = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.user = JSON.parse(localStorage.getItem("accessToken") ?? "");
    this.getUsers();
                                              
    this.hub = new signalR.HubConnectionBuilder().withUrl("https://localhost:7298/chat-hub").build();

    this.hub.start().then(() => {
      console.log("Connection started...");

      this.hub?.invoke("Connect", this.user.id);

      this.hub?.on("Users", (res: UserModel) => {
        console.log(res);
        const user = this.users.find(p => p.id == res.id);
        if (user) {
          user.status = res.status;
        }
      });

      this.hub?.on("Messages", (res: ChatModel) => {
        console.log(res);
        if (this.selectedUserId == res.userId) {
          this.chats.push(res);
          this.shouldScrollToBottom = true;
        } else {
          const user = this.users.find(u => u.id === res.userId);
          if (user) {
            user.hasNewMessage = true;
          }
        }
      });
    });

    this.hub.onclose((error) => {
      console.log("Connection closed");
      this.users.forEach(user => user.status = 'offline');
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  getUsers() {
    this.http.get<UserModel[]>("https://localhost:7298/api/Chats/GetUsers").subscribe(res => {
      this.users = res.filter(p => p.id != this.user.id);
    });
  }

  changeUser(user: UserModel) {
    this.selectedUserId = user.id;
    this.selectedUser = user;
    this.toggleSidebar();
    user.hasNewMessage = false;

    this.http.get(`https://localhost:7298/api/Chats/GetChats?userId=${this.user.id}&toUserId=${this.selectedUserId}`)
      .subscribe((res: any) => {
        this.chats = res;
        this.shouldScrollToBottom = true;
      });
  }

  logout() {
    this.hub?.stop().then(() => {
      localStorage.clear();
      this.router.navigate(['/login']);
    });
  }

  sendMessage() {
    if (this.message.trim() === '') return;

    const data = {
      "userId": this.user.id,
      "toUserId": this.selectedUser.id,
      "message": this.message
    };
    this.http.post<ChatModel>("https://localhost:7298/api/Chats/SendMessage", data).subscribe((res) => {
      this.chats.push(res);
      this.message = "";
      this.shouldScrollToBottom = true;
    });
  }

  private scrollToBottom(): void {
    try {
      this.chatHistory.nativeElement.scrollTop = this.chatHistory.nativeElement.scrollHeight;
    } catch (err) { }
  }

  toggleSidebar() {
    this.isSidebarVisible = !this.isSidebarVisible;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.toggle('active');
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (event.target.innerWidth > 767.98) {
      this.isSidebarVisible = false;
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.remove('active');
      }
    }
  }
}