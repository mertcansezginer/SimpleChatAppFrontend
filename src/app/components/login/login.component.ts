import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  name: string = "";
  password: string = "";
  errorMessage: string = "";

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.errorMessage = "";
    this.http.get(`https://localhost:7298/api/Auth/Login?name=${this.name}&password=${this.password}`).subscribe({
      next: (res) => {  
        localStorage.setItem("accessToken", JSON.stringify(res));
        console.log("Giriş başarılı");      
        this.router.navigateByUrl("/");
      },
      error: (error: HttpErrorResponse) => {
        console.error("Giriş başarısız", error);
        if (error.status === 400) {
          this.errorMessage = "Geçersiz Ad Soyad veya Şifre girdiniz, lütfen tekrar deneyin.";
        } else {
          this.errorMessage = "Giriş yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        }
      }
    });
  }
}