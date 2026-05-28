class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:8083/api';
        this.userId = localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null;
        console.log('[ApiService] Initialized with userId:', this.userId || 'Not logged in');
    }

    getUserId() {
        return this.userId;
    }

    setUserId(userId) {
        this.userId = Number(userId);
        localStorage.setItem('userId', this.userId);
        console.log('[ApiService] User ID set:', this.userId);
    }

    clearUserId() {
        this.userId = null;
        localStorage.removeItem('userId');
        console.log('[ApiService] User ID cleared (logged out)');
    }

    async request(url, options = {}) {
        try {
            console.log('API Request:', url, options);

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options,
                mode: 'cors',
                credentials: 'include'
            };

            if (options.body && typeof options.body === 'object') {
                config.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, config);
            console.log('Response Status:', response.status);

            if (!response.ok) {
                let errorText = '';
                try { errorText = await response.text(); } catch (e) {}
                console.error('API Error:', response.status, errorText);

                if (response.status === 401) {
                    this.clearUserId();
                    window.location.href = '/auth.html';
                }

                throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                console.log('API Response Data:', data);
                return data;
            } else {
                console.log('API Response: Non-JSON');
                return null;
            }
        } catch (error) {
            console.error('API Request Failed:', error.message);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.warn('CORS/Network issue — continuing safely');
            }
            throw error;
        }
    }

    // Get current user info
    async getCurrentUser() {
        if (!this.userId) throw new Error('User not logged in');
        return this.request(`${this.baseUrl}/users/${this.userId}`);
    }

    // Update user profile
    async updateUser(userId, userData) {
        if (!this.userId) throw new Error('User not logged in');
        return this.request(`${this.baseUrl}/users/update/${userId}`, { 
            method: 'PATCH', 
            body: userData 
        });
    }

    // ✅ Password & OTP related methods (your requested methods)
    async changePassword(userId, oldPassword, newPassword) {
        if (!this.userId) throw new Error('User not logged in');
        return this.request(`${this.baseUrl}/users/change-password/${userId}`, {
            method: 'PATCH',
            body: { oldPassword, newPassword }
        });
    }

    async sendEmailOtp(email) {
        console.log('[ApiService] Sending email OTP to:', email);
        return this.request(`${this.baseUrl}/otp/send-email-body`, { 
            method: 'POST', 
            body: { email } 
        });
    }

    async verifyEmailOtp(email, otp) {
        console.log('[ApiService] Verifying email OTP for:', email);
        return this.request(`${this.baseUrl}/otp/verify-email`, {
            method: 'POST',
            body: { email, otp }
        });
    }

    async resetPasswordWithOtp(email, otp, newPassword) {
        console.log('[ApiService] Resetting password with OTP');
        return this.request(`${this.baseUrl}/users/reset-password`, {
            method: 'POST',
            body: { email, otp, newPassword }
        });
    }
}

// Create global instance
window.apiService = new ApiService();

console.log('ApiService Loaded — Password/OTP functions ready!');