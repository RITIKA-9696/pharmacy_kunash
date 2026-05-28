const toggleBtn = document.getElementById("toggleBtn");
const formSection = document.getElementById("formSection");
const sidePanel = document.getElementById("sidePanel");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const panelTitle = document.getElementById("panelTitle");
const panelDesc = document.getElementById("panelDesc");
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const closePopup = document.getElementById("closePopup");

// API Base URL - Update this to match your backend URL
const API_BASE_URL = "http://localhost:8083/api/admins";

let isLogin = false;

// API Service Functions
const adminApiService = {
    // Create Admin (Signup)
    async createAdmin(adminData) {
        try {
            const response = await fetch(`${API_BASE_URL}/create-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(adminData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Create admin error:', error);
            throw error;
        }
    },

    // Login (Get admin by email)
    async login(email, password) {
        try {
            // First get admin by email
            const response = await fetch(`${API_BASE_URL}/get-by-email/${email}`);
            
            if (!response.ok) {
                throw new Error('Invalid email or password');
            }
            
            const admin = await response.json();
            
            // In a real application, you would verify the password here
            // For now, we'll assume the backend handles authentication
            // You might want to implement a proper login endpoint later
            
            return admin;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Reset Password
    async resetPassword(adminId, oldPassword, newPassword) {
        try {
            const response = await fetch(`${API_BASE_URL}/reset-password/${adminId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    oldPassword,
                    newPassword
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Password reset failed');
            }
            
            return await response.text();
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    }
};

// Show pop-up with message
function showPopup(title, message, isSuccess) {
    popupTitle.textContent = title;
    popupMessage.innerHTML = message;
    popupTitle.classList.toggle("text-green-600", isSuccess);
    popupTitle.classList.toggle("text-red-600", !isSuccess);
    popup.classList.remove("hidden");
    popup.classList.add("show");

    setTimeout(() => {
        closePopupFn();
    }, 3000);
}

// Close pop-up
function closePopupFn() {
    popup.classList.remove("show");
    popup.classList.add("hidden");
}

// Toggle to login form
function switchToLogin() {
    isLogin = true;
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    formSection.style.transform = "translateX(100%)";
    sidePanel.style.transform = "translateX(-100%)";  
    sidePanel.classList.remove("rounded-l-[100px]");
    sidePanel.classList.add("rounded-r-[100px]");
    panelTitle.textContent = "New to pharmacy - kunash?";
    panelDesc.textContent = "Create an account to access our services";
    toggleBtn.textContent = "Register";

    [signupForm, loginForm].forEach(form => {
        clearErrors(form);
        form.reset();
        form.querySelectorAll("input").forEach(input => {
            input.disabled = false;
            input.readOnly = false;
            input.style.pointerEvents = "auto";
        });
    });

    setupValidation();
    setupFormSubmission();
    setupTogglePassword();
}

// Attach close event to popup close button
closePopup.addEventListener("click", closePopupFn);

// Validation functions (unchanged)
function validateName(name) {
    if (!name) return "This field is required.";
    const nameRegex = /^[A-Za-z]{2,50}$/;
    return nameRegex.test(name) ? "" : "Must be 2–50 letters only.";
}

function validatePhone(phone) {
    if (!phone) return "This field is required.";
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone) ? "" : "Must be 10–15 digits, optionally starting with +.";
}

function validateEmail(email) {
    if (!email) return "This field is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "" : "Invalid email format.";
}

function validateUsername(username) {
    if (!username) return "This field is required.";
    const usernameRegex = /^[A-Za-z0-9_-]{3,20}$/;
    return usernameRegex.test(username) ? "" : "Must be 3–20 characters, alphanumeric with underscores or hyphens.";
}

function validatePassword(password) {
    if (!password) return "This field is required.";
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
    return passwordRegex.test(password) ? "" : "Must be 8–20 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).";
}

function validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) return "This field is required.";
    return password === confirmPassword ? "" : "Passwords do not match.";
}

// Real-time password strength feedback
function updatePasswordStrength(input) {
    const strengthDiv = input.closest("div").querySelector(".password-strength");
    if (!strengthDiv) return;

    const value = input.value;
    if (!value) {
        strengthDiv.classList.add("hidden");
        return;
    }

    strengthDiv.classList.remove("hidden");

    const checks = [
        { class: "strength-length", regex: /.{8,20}/, text: "8–20 characters" },
        { class: "strength-uppercase", regex: /[A-Z]/, text: "Uppercase letter" },
        { class: "strength-lowercase", regex: /[a-z]/, text: "Lowercase letter" },
        { class: "strength-number", regex: /\d/, text: "Number" },
        { class: "strength-special", regex: /[!@#$%^&*]/, text: "Special character (!@#$%^&*)" },
    ];

    checks.forEach(check => {
        const element = strengthDiv.querySelector(`.${check.class}`);
        const icon = element.querySelector("i");
        if (check.regex.test(value)) {
            icon.classList.remove("fa-times", "text-red-500");
            icon.classList.add("fa-check", "text-green-500");
        } else {
            icon.classList.remove("fa-check", "text-green-500");
            icon.classList.add("fa-times", "text-red-500");
        }
    });
}

// Clear errors
function clearErrors(form) {
    form.querySelectorAll(".error").forEach(error => {
        error.textContent = "";
        error.classList.add("hidden");
    });
    const passwordStrength = form.querySelector(".password-strength");
    if (passwordStrength) {
        passwordStrength.classList.add("hidden");
    }
}

// Toggle show/hide password
function setupTogglePassword() {
    const toggleButtons = document.querySelectorAll("#signupForm .toggle-password, #loginForm .toggle-password");
    toggleButtons.forEach((btn) => {
        btn.removeEventListener("click", btn._toggleHandler);
        btn._toggleHandler = (e) => {
            e.preventDefault();
            const wrapper = btn.closest("div");
            const input = wrapper.querySelector("input");
            const icon = btn.querySelector("i");

            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            } else {
                input.type = "password";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            }
        };
        btn.addEventListener("click", btn._toggleHandler);
    });
}

// Real-time validation
function setupValidation() {
    [signupForm, loginForm].forEach(form => {
        const inputs = form.querySelectorAll("input:not([type='checkbox'])");
        inputs.forEach(input => {
            input.removeEventListener("input", input._validationHandler);
            input._validationHandler = () => {
                const errorSpan = input.closest("div").querySelector(".error");
                let error = "";

                if (input.name === "firstName" || input.name === "lastName") {
                    error = validateName(input.value);
                } else if (input.name === "phone") {
                    error = validatePhone(input.value);
                } else if (input.name === "email") {
                    error = validateEmail(input.value);
                } else if (input.name === "username") {
                    error = validateUsername(input.value);
                } else if (input.name === "password" && form.id === "signupForm") {
                    error = validatePassword(input.value);
                    updatePasswordStrength(input);
                    const confirmInput = form.querySelector("input[name='confirmPassword']");
                    if (confirmInput && confirmInput.value) {
                        const confirmErrorSpan = confirmInput.closest("div").querySelector(".error");
                        const confirmError = validateConfirmPassword(input.value, confirmInput.value);
                        if (confirmErrorSpan) {
                            confirmErrorSpan.textContent = confirmError;
                            confirmErrorSpan.classList.toggle("hidden", !confirmError);
                        }
                    }
                } else if (input.name === "password" && form.id === "loginForm") {
                    error = validatePassword(input.value);
                } else if (input.name === "confirmPassword") {
                    const password = form.querySelector("input[name='password']").value;
                    error = validateConfirmPassword(password, input.value);
                }

                if (errorSpan) {
                    errorSpan.textContent = error;
                    errorSpan.classList.toggle("hidden", !error);
                }
            };
            input.addEventListener("input", input._validationHandler);
            input._validationHandler();
        });
    });
}

// Form submission with API integration
// function setupFormSubmission() {
//     [signupForm, loginForm].forEach(form => {
//         form.removeEventListener("submit", form._submitHandler);
//         form._submitHandler = async (e) => {
//             e.preventDefault();
//             let isValid = true;
//             let errors = [];

//             clearErrors(form);

//             const inputs = form.querySelectorAll("input:not([type='checkbox'])");
//             let passwordValue = "";
//             inputs.forEach(input => {
//                 const errorSpan = input.closest("div").querySelector(".error");
//                 let error = "";

//                 if (input.name === "firstName" || input.name === "lastName") {
//                     error = validateName(input.value);
//                 } else if (input.name === "phone") {
//                     error = validatePhone(input.value);
//                 } else if (input.name === "email") {
//                     error = validateEmail(input.value);
//                 } else if (input.name === "username") {
//                     error = validateUsername(input.value);
//                 } else if (input.name === "password") {
//                     error = validatePassword(input.value);
//                     passwordValue = input.value;
//                     if (form.id === "signupForm") {
//                         updatePasswordStrength(input);
//                     }
//                 } else if (input.name === "confirmPassword") {
//                     error = validateConfirmPassword(passwordValue, input.value);
//                 }

//                 if (error) {
//                     isValid = false;
//                     errors.push(error);
//                     if (errorSpan) {
//                         errorSpan.textContent = error;
//                         errorSpan.classList.remove("hidden");
//                     }
//                 }
//             });

//             if (isValid) {
//                 const submitBtn = form.querySelector("button");
//                 const originalText = submitBtn.innerHTML;
//                 submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
//                 submitBtn.disabled = true;

//                 try {
//                     if (form.id === "signupForm") {
//                         // Registration logic
//                         const formData = new FormData(form);
//                         const adminData = {
//                             firstName: formData.get('firstName'),
//                             lastName: formData.get('lastName'),
//                             email: formData.get('email'),
//                             phoneNumber: formData.get('phone'),
//                             username: formData.get('username'),
//                             password: formData.get('password')
//                         };

//                         const response = await adminApiService.createAdmin(adminData);
                        
//                         showPopup(
//                             "Registration Successful",
//                             `Your account has been created! Welcome ${response.firstName}. Please log in.`,
//                             true
//                         );
                        
//                         form.reset();
//                         clearErrors(form);
//                         setTimeout(switchToLogin, 3000);
                        
//                     } else {
//                         // Login logic
//                         const formData = new FormData(form);
//                         const loginData = {
//                             email: formData.get('email'),
//                             password: formData.get('password')
//                         };

//                         const admin = await adminApiService.login(loginData.email, loginData.password);
                        
//                         // === UPDATED SESSION STORAGE WITH 24-HOUR EXPIRATION ===
//                         const sessionData = {
//                             admin: admin,
//                             expiresAt: Date.now() + 24 * 60 * 60 * 1000  // 24 hours from now
//                         };
//                         localStorage.setItem('adminSession', JSON.stringify(sessionData));
//                         // (Old keys removed to avoid confusion)

//                         showPopup(
//                             "Login Successful",
//                             `Welcome ${admin.firstName}! Redirecting to your dashboard...`,
//                             true
//                         );
                        
//                         setTimeout(() => {
//                             window.location.href = "../Dashboard/dashboard.html";
//                         }, 2000);
//                     }
//                 } catch (error) {
//                     showPopup(
//                         form.id === "loginForm" ? "Login Failed" : "Registration Failed",
//                         error.message || "An error occurred. Please try again.",
//                         false
//                     );
//                 } finally {
//                     submitBtn.innerHTML = originalText;
//                     submitBtn.disabled = false;
//                 }
//             } else {
//                 showPopup(
//                     form.id === "loginForm" ? "Login Failed" : "Registration Failed",
//                     errors.join(" "),
//                     false
//                 );
//             }
//         };
//         form.addEventListener("submit", form._submitHandler);
//     });
// }


// Form submission with API integration
function setupFormSubmission() {
    [signupForm, loginForm].forEach(form => {
        form.removeEventListener("submit", form._submitHandler);
        form._submitHandler = async (e) => {
            e.preventDefault();
            let isValid = true;
            let errors = [];

            clearErrors(form);

            const inputs = form.querySelectorAll("input:not([type='checkbox'])");
            let passwordValue = "";
            inputs.forEach(input => {
                const errorSpan = input.closest("div").querySelector(".error");
                let error = "";

                if (input.name === "firstName" || input.name === "lastName") {
                    error = validateName(input.value);
                } else if (input.name === "phone") {
                    error = validatePhone(input.value);
                } else if (input.name === "email") {
                    error = validateEmail(input.value);
                } else if (input.name === "username") {
                    error = validateUsername(input.value);
                } else if (input.name === "password") {
                    error = validatePassword(input.value);
                    passwordValue = input.value;
                    if (form.id === "signupForm") {
                        updatePasswordStrength(input);
                    }
                } else if (input.name === "confirmPassword") {
                    error = validateConfirmPassword(passwordValue, input.value);
                }

                if (error) {
                    isValid = false;
                    errors.push(error);
                    if (errorSpan) {
                        errorSpan.textContent = error;
                        errorSpan.classList.remove("hidden");
                    }
                }
            });

            if (isValid) {
                const submitBtn = form.querySelector("button");
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                submitBtn.disabled = true;

                try {
                    if (form.id === "signupForm") {
                        // Registration logic (unchanged)
                        const formData = new FormData(form);
                        const adminData = {
                            firstName: formData.get('firstName'),
                            lastName: formData.get('lastName'),
                            email: formData.get('email'),
                            phoneNumber: formData.get('phone'),
                            username: formData.get('username'),
                            password: formData.get('password')
                        };

                        const response = await adminApiService.createAdmin(adminData);
                        
                        showPopup(
                            "Registration Successful",
                            `Your account has been created! Welcome ${response.firstName}. Please log in.`,
                            true
                        );
                        
                        form.reset();
                        clearErrors(form);
                        setTimeout(switchToLogin, 3000);
                        
                    } else {
                        // Login logic with ROLE-BASED REDIRECTION
                        const formData = new FormData(form);
                        const loginData = {
                            email: formData.get('email'),
                            password: formData.get('password')
                        };

                        const admin = await adminApiService.login(loginData.email, loginData.password);
                        
                        // Save session with 24-hour expiration
                        const sessionData = {
                            admin: admin,
                            expiresAt: Date.now() + 24 * 60 * 60 * 1000
                        };
                        localStorage.setItem('adminSession', JSON.stringify(sessionData));

                        // Determine redirect path based on role
                        let redirectPath = "../Dashboard/dashboard.html"; // default for SUPER_ADMIN or unknown

                        const role = (admin.role || "").trim().toUpperCase();

                        if (role === "ROLE_ADMIN") {
                            redirectPath = "../Inventory/inventory.html";
                        }
                        // You can easily add more roles later, example:
                        // else if (role === "ROLE_MANAGER") {
                        //     redirectPath = "../some-other-page.html";
                        // }

                        showPopup(
                            "Login Successful",
                            `Welcome ${admin.firstName}! Redirecting...`,
                            true
                        );
                        
                        setTimeout(() => {
                            window.location.href = redirectPath;
                        }, 2000);
                    }
                } catch (error) {
                    showPopup(
                        form.id === "loginForm" ? "Login Failed" : "Registration Failed",
                        error.message || "An error occurred. Please try again.",
                        false
                    );
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            } else {
                showPopup(
                    form.id === "loginForm" ? "Login Failed" : "Registration Failed",
                    errors.join(" <br>"),
                    false
                );
            }
        };
        form.addEventListener("submit", form._submitHandler);
    });
}

// Form toggle
toggleBtn.addEventListener("click", () => {
    isLogin = !isLogin;

    if (isLogin) {
        switchToLogin();
    } else {
        signupForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        formSection.style.transform = "translateX(0)";
        sidePanel.style.transform = "translateX(0)";
        sidePanel.classList.remove("rounded-r-[100px]");
        sidePanel.classList.add("rounded-l-[100px]");
        panelTitle.textContent = "Welcome! to pharmacy - kunash!";
        panelDesc.textContent = "Manage your pharmacy with our professional admin tools";
        toggleBtn.textContent = "Login";

        [signupForm, loginForm].forEach(form => {
            clearErrors(form);
            form.reset();
            form.querySelectorAll("input").forEach(input => {
                input.disabled = false;
                input.readOnly = false;
                input.style.pointerEvents = "auto";
            });
        });

        setupValidation();
        setupFormSubmission();
        setupTogglePassword();
    }
});

// Initialize functionality
document.addEventListener("DOMContentLoaded", () => {
    [signupForm, loginForm].forEach(form => {
        form.querySelectorAll("input").forEach(input => {
            input.disabled = false;
            input.readOnly = false;
            input.style.pointerEvents = "auto";
        });
    });

    setupTogglePassword();
    setupValidation();
    setupFormSubmission();

    // === FORCE DEFAULT TO LOGIN FORM ON PAGE LOAD ===
    switchToLogin();
});

console.log("login.js loaded and initialized");



























// const toggleBtn = document.getElementById("toggleBtn");
// const formSection = document.getElementById("formSection");
// const sidePanel = document.getElementById("sidePanel");
// const signupForm = document.getElementById("signupForm");
// const loginForm = document.getElementById("loginForm");
// const panelTitle = document.getElementById("panelTitle");
// const panelDesc = document.getElementById("panelDesc");
// const popup = document.getElementById("popup");
// const popupTitle = document.getElementById("popupTitle");
// const popupMessage = document.getElementById("popupMessage");
// const closePopup = document.getElementById("closePopup");

// // API Base URL - Update this to match your backend URL
// const API_BASE_URL = "http://localhost:8083/api/admins";

// let isLogin = false;

// // API Service Functions
// const adminApiService = {
//     // Create Admin (Signup)
//     async createAdmin(adminData) {
//         try {
//             const response = await fetch(`${API_BASE_URL}/create-admin`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(adminData)
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Registration failed');
//             }
            
//             return await response.json();
//         } catch (error) {
//             console.error('Create admin error:', error);
//             throw error;
//         }
//     },

//     // Login (Get admin by email)
//     async login(email, password) {
//         try {
//             // First get admin by email
//             const response = await fetch(`${API_BASE_URL}/get-by-email/${email}`);
            
//             if (!response.ok) {
//                 throw new Error('Invalid email or password');
//             }
            
//             const admin = await response.json();
            
//             // In a real application, you would verify the password here
//             // For now, we'll assume the backend handles authentication
//             // You might want to implement a proper login endpoint later
            
//             return admin;
//         } catch (error) {
//             console.error('Login error:', error);
//             throw error;
//         }
//     },

//     // Reset Password
//     async resetPassword(adminId, oldPassword, newPassword) {
//         try {
//             const response = await fetch(`${API_BASE_URL}/reset-password/${adminId}`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     oldPassword,
//                     newPassword
//                 })
//             });
            
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Password reset failed');
//             }
            
//             return await response.text();
//         } catch (error) {
//             console.error('Reset password error:', error);
//             throw error;
//         }
//     }
// };

// // Show pop-up with message
// function showPopup(title, message, isSuccess) {
//     popupTitle.textContent = title;
//     popupMessage.innerHTML = message;
//     popupTitle.classList.toggle("text-green-600", isSuccess);
//     popupTitle.classList.toggle("text-red-600", !isSuccess);
//     popup.classList.remove("hidden");
//     popup.classList.add("show");

//     setTimeout(() => {
//         closePopupFn();
//     }, 3000);
// }

// // Close pop-up
// function closePopupFn() {
//     popup.classList.remove("show");
//     popup.classList.add("hidden");
// }

// // Toggle to login form
// function switchToLogin() {
//     isLogin = true;
//     signupForm.classList.add("hidden");
//     loginForm.classList.remove("hidden");
//     formSection.style.transform = "translateX(100%)";
//     sidePanel.style.transform = "translateX(-100%)";  
//     sidePanel.classList.remove("rounded-l-[100px]");
//     sidePanel.classList.add("rounded-r-[100px]");
//     panelTitle.textContent = "New to Good Neews?";
//     panelDesc.textContent = "Create an account to access our services";
//     toggleBtn.textContent = "Register";

//     [signupForm, loginForm].forEach(form => {
//         clearErrors(form);
//         form.reset();
//         form.querySelectorAll("input").forEach(input => {
//             input.disabled = false;
//             input.readOnly = false;
//             input.style.pointerEvents = "auto";
//         });
//     });

//     setupValidation();
//     setupFormSubmission();
//     setupTogglePassword();
// }

// // Attach close event to popup close button
// closePopup.addEventListener("click", closePopupFn);

// // Validation functions (unchanged)
// function validateName(name) {
//     if (!name) return "This field is required.";
//     const nameRegex = /^[A-Za-z]{2,50}$/;
//     return nameRegex.test(name) ? "" : "Must be 2–50 letters only.";
// }

// function validatePhone(phone) {
//     if (!phone) return "This field is required.";
//     const phoneRegex = /^\+?[0-9]{10,15}$/;
//     return phoneRegex.test(phone) ? "" : "Must be 10–15 digits, optionally starting with +.";
// }

// function validateEmail(email) {
//     if (!email) return "This field is required.";
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email) ? "" : "Invalid email format.";
// }

// function validateUsername(username) {
//     if (!username) return "This field is required.";
//     const usernameRegex = /^[A-Za-z0-9_-]{3,20}$/;
//     return usernameRegex.test(username) ? "" : "Must be 3–20 characters, alphanumeric with underscores or hyphens.";
// }

// function validatePassword(password) {
//     if (!password) return "This field is required.";
//     const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/;
//     return passwordRegex.test(password) ? "" : "Must be 8–20 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).";
// }

// function validateConfirmPassword(password, confirmPassword) {
//     if (!confirmPassword) return "This field is required.";
//     return password === confirmPassword ? "" : "Passwords do not match.";
// }

// // Real-time password strength feedback
// function updatePasswordStrength(input) {
//     const strengthDiv = input.closest("div").querySelector(".password-strength");
//     if (!strengthDiv) return;

//     const value = input.value;
//     if (!value) {
//         strengthDiv.classList.add("hidden");
//         return;
//     }

//     strengthDiv.classList.remove("hidden");

//     const checks = [
//         { class: "strength-length", regex: /.{8,20}/, text: "8–20 characters" },
//         { class: "strength-uppercase", regex: /[A-Z]/, text: "Uppercase letter" },
//         { class: "strength-lowercase", regex: /[a-z]/, text: "Lowercase letter" },
//         { class: "strength-number", regex: /\d/, text: "Number" },
//         { class: "strength-special", regex: /[!@#$%^&*]/, text: "Special character (!@#$%^&*)" },
//     ];

//     checks.forEach(check => {
//         const element = strengthDiv.querySelector(`.${check.class}`);
//         const icon = element.querySelector("i");
//         if (check.regex.test(value)) {
//             icon.classList.remove("fa-times", "text-red-500");
//             icon.classList.add("fa-check", "text-green-500");
//         } else {
//             icon.classList.remove("fa-check", "text-green-500");
//             icon.classList.add("fa-times", "text-red-500");
//         }
//     });
// }

// // Clear errors
// function clearErrors(form) {
//     form.querySelectorAll(".error").forEach(error => {
//         error.textContent = "";
//         error.classList.add("hidden");
//     });
//     const passwordStrength = form.querySelector(".password-strength");
//     if (passwordStrength) {
//         passwordStrength.classList.add("hidden");
//     }
// }

// // Toggle show/hide password
// function setupTogglePassword() {
//     const toggleButtons = document.querySelectorAll("#signupForm .toggle-password, #loginForm .toggle-password");
//     toggleButtons.forEach((btn) => {
//         btn.removeEventListener("click", btn._toggleHandler);
//         btn._toggleHandler = (e) => {
//             e.preventDefault();
//             const wrapper = btn.closest("div");
//             const input = wrapper.querySelector("input");
//             const icon = btn.querySelector("i");

//             if (input.type === "password") {
//                 input.type = "text";
//                 icon.classList.remove("fa-eye-slash");
//                 icon.classList.add("fa-eye");
//             } else {
//                 input.type = "password";
//                 icon.classList.remove("fa-eye");
//                 icon.classList.add("fa-eye-slash");
//             }
//         };
//         btn.addEventListener("click", btn._toggleHandler);
//     });
// }

// // Real-time validation
// function setupValidation() {
//     [signupForm, loginForm].forEach(form => {
//         const inputs = form.querySelectorAll("input:not([type='checkbox'])");
//         inputs.forEach(input => {
//             input.removeEventListener("input", input._validationHandler);
//             input._validationHandler = () => {
//                 const errorSpan = input.closest("div").querySelector(".error");
//                 let error = "";

//                 if (input.name === "firstName" || input.name === "lastName") {
//                     error = validateName(input.value);
//                 } else if (input.name === "phone") {
//                     error = validatePhone(input.value);
//                 } else if (input.name === "email") {
//                     error = validateEmail(input.value);
//                 } else if (input.name === "username") {
//                     error = validateUsername(input.value);
//                 } else if (input.name === "password" && form.id === "signupForm") {
//                     error = validatePassword(input.value);
//                     updatePasswordStrength(input);
//                     const confirmInput = form.querySelector("input[name='confirmPassword']");
//                     if (confirmInput && confirmInput.value) {
//                         const confirmErrorSpan = confirmInput.closest("div").querySelector(".error");
//                         const confirmError = validateConfirmPassword(input.value, confirmInput.value);
//                         if (confirmErrorSpan) {
//                             confirmErrorSpan.textContent = confirmError;
//                             confirmErrorSpan.classList.toggle("hidden", !confirmError);
//                         }
//                     }
//                 } else if (input.name === "password" && form.id === "loginForm") {
//                     error = validatePassword(input.value);
//                 } else if (input.name === "confirmPassword") {
//                     const password = form.querySelector("input[name='password']").value;
//                     error = validateConfirmPassword(password, input.value);
//                 }

//                 if (errorSpan) {
//                     errorSpan.textContent = error;
//                     errorSpan.classList.toggle("hidden", !error);
//                 }
//             };
//             input.addEventListener("input", input._validationHandler);
//             input._validationHandler();
//         });
//     });
// }

// // Form submission with API integration
// // function setupFormSubmission() {
// //     [signupForm, loginForm].forEach(form => {
// //         form.removeEventListener("submit", form._submitHandler);
// //         form._submitHandler = async (e) => {
// //             e.preventDefault();
// //             let isValid = true;
// //             let errors = [];

// //             clearErrors(form);

// //             const inputs = form.querySelectorAll("input:not([type='checkbox'])");
// //             let passwordValue = "";
// //             inputs.forEach(input => {
// //                 const errorSpan = input.closest("div").querySelector(".error");
// //                 let error = "";

// //                 if (input.name === "firstName" || input.name === "lastName") {
// //                     error = validateName(input.value);
// //                 } else if (input.name === "phone") {
// //                     error = validatePhone(input.value);
// //                 } else if (input.name === "email") {
// //                     error = validateEmail(input.value);
// //                 } else if (input.name === "username") {
// //                     error = validateUsername(input.value);
// //                 } else if (input.name === "password") {
// //                     error = validatePassword(input.value);
// //                     passwordValue = input.value;
// //                     if (form.id === "signupForm") {
// //                         updatePasswordStrength(input);
// //                     }
// //                 } else if (input.name === "confirmPassword") {
// //                     error = validateConfirmPassword(passwordValue, input.value);
// //                 }

// //                 if (error) {
// //                     isValid = false;
// //                     errors.push(error);
// //                     if (errorSpan) {
// //                         errorSpan.textContent = error;
// //                         errorSpan.classList.remove("hidden");
// //                     }
// //                 }
// //             });

// //             if (isValid) {
// //                 const submitBtn = form.querySelector("button");
// //                 const originalText = submitBtn.innerHTML;
// //                 submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
// //                 submitBtn.disabled = true;

// //                 try {
// //                     if (form.id === "signupForm") {
// //                         // Registration logic
// //                         const formData = new FormData(form);
// //                         const adminData = {
// //                             firstName: formData.get('firstName'),
// //                             lastName: formData.get('lastName'),
// //                             email: formData.get('email'),
// //                             phoneNumber: formData.get('phone'),
// //                             username: formData.get('username'),
// //                             password: formData.get('password')
// //                         };

// //                         const response = await adminApiService.createAdmin(adminData);
                        
// //                         showPopup(
// //                             "Registration Successful",
// //                             `Your account has been created! Welcome ${response.firstName}. Please log in.`,
// //                             true
// //                         );
                        
// //                         form.reset();
// //                         clearErrors(form);
// //                         setTimeout(switchToLogin, 3000);
                        
// //                     } else {
// //                         // Login logic
// //                         const formData = new FormData(form);
// //                         const loginData = {
// //                             email: formData.get('email'),
// //                             password: formData.get('password')
// //                         };

// //                         const admin = await adminApiService.login(loginData.email, loginData.password);
                        
// //                         // === UPDATED SESSION STORAGE WITH 24-HOUR EXPIRATION ===
// //                         const sessionData = {
// //                             admin: admin,
// //                             expiresAt: Date.now() + 24 * 60 * 60 * 1000  // 24 hours from now
// //                         };
// //                         localStorage.setItem('adminSession', JSON.stringify(sessionData));
// //                         // (Old keys removed to avoid confusion)

// //                         showPopup(
// //                             "Login Successful",
// //                             `Welcome ${admin.firstName}! Redirecting to your dashboard...`,
// //                             true
// //                         );
                        
// //                         setTimeout(() => {
// //                             window.location.href = "../Dashboard/dashboard.html";
// //                         }, 2000);
// //                     }
// //                 } catch (error) {
// //                     showPopup(
// //                         form.id === "loginForm" ? "Login Failed" : "Registration Failed",
// //                         error.message || "An error occurred. Please try again.",
// //                         false
// //                     );
// //                 } finally {
// //                     submitBtn.innerHTML = originalText;
// //                     submitBtn.disabled = false;
// //                 }
// //             } else {
// //                 showPopup(
// //                     form.id === "loginForm" ? "Login Failed" : "Registration Failed",
// //                     errors.join(" "),
// //                     false
// //                 );
// //             }
// //         };
// //         form.addEventListener("submit", form._submitHandler);
// //     });
// // }



// function setupFormSubmission() {
//     [signupForm, loginForm].forEach(form => {
//         form.removeEventListener("submit", form._submitHandler);
//         form._submitHandler = async (e) => {
//             e.preventDefault();
//             let isValid = true;
//             let errors = [];

//             clearErrors(form);

//             const inputs = form.querySelectorAll("input:not([type='checkbox'])");
//             let passwordValue = "";
//             inputs.forEach(input => {
//                 const errorSpan = input.closest("div").querySelector(".error");
//                 let error = "";

//                 if (input.name === "firstName" || input.name === "lastName") {
//                     error = validateName(input.value);
//                 } else if (input.name === "phone") {
//                     error = validatePhone(input.value);
//                 } else if (input.name === "email") {
//                     error = validateEmail(input.value);
//                 } else if (input.name === "username") {
//                     error = validateUsername(input.value);
//                 } else if (input.name === "password") {
//                     error = validatePassword(input.value);
//                     passwordValue = input.value;
//                     if (form.id === "signupForm") {
//                         updatePasswordStrength(input);
//                     }
//                 } else if (input.name === "confirmPassword") {
//                     error = validateConfirmPassword(passwordValue, input.value);
//                 }

//                 if (error) {
//                     isValid = false;
//                     errors.push(error);
//                     if (errorSpan) {
//                         errorSpan.textContent = error;
//                         errorSpan.classList.remove("hidden");
//                     }
//                 }
//             });

//             if (isValid) {
//                 const submitBtn = form.querySelector("button");
//                 const originalText = submitBtn.innerHTML;
//                 submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
//                 submitBtn.disabled = true;

//                 try {
//                     if (form.id === "signupForm") {
//                         // Registration logic (unchanged)
//                         const formData = new FormData(form);
//                         const adminData = {
//                             firstName: formData.get('firstName'),
//                             lastName: formData.get('lastName'),
//                             email: formData.get('email'),
//                             phoneNumber: formData.get('phone'),
//                             username: formData.get('username'),
//                             password: formData.get('password')
//                         };

//                         const response = await adminApiService.createAdmin(adminData);
                        
//                         showPopup(
//                             "Registration Successful",
//                             `Your account has been created! Welcome ${response.firstName}. Please log in.`,
//                             true
//                         );
                        
//                         form.reset();
//                         clearErrors(form);
//                         setTimeout(switchToLogin, 3000);
                        
//                     } else {
//                         // Login logic with ROLE-BASED REDIRECTION
//                         const formData = new FormData(form);
//                         const loginData = {
//                             email: formData.get('email'),
//                             password: formData.get('password')
//                         };

//                         const admin = await adminApiService.login(loginData.email, loginData.password);
                        
//                         // Save session with 24-hour expiration
//                         const sessionData = {
//                             admin: admin,
//                             expiresAt: Date.now() + 24 * 60 * 60 * 1000
//                         };
//                         localStorage.setItem('adminSession', JSON.stringify(sessionData));

//                         // Determine redirect path based on role
//                         let redirectPath = "../Dashboard/dashboard.html"; // default for SUPER_ADMIN or unknown

//                         const role = (admin.role || "").trim().toUpperCase();

//                         if (role === "ROLE_ADMIN") {
//                             redirectPath = "../Inventory/inventory.html";
//                         }
//                         // You can easily add more roles later, example:
//                         // else if (role === "ROLE_MANAGER") {
//                         //     redirectPath = "../some-other-page.html";
//                         // }

//                         showPopup(
//                             "Login Successful",
//                             `Welcome ${admin.firstName}! Redirecting...`,
//                             true
//                         );
                        
//                         setTimeout(() => {
//                             window.location.href = redirectPath;
//                         }, 2000);
//                     }
//                 } catch (error) {
//                     showPopup(
//                         form.id === "loginForm" ? "Login Failed" : "Registration Failed",
//                         error.message || "An error occurred. Please try again.",
//                         false
//                     );
//                 } finally {
//                     submitBtn.innerHTML = originalText;
//                     submitBtn.disabled = false;
//                 }
//             } else {
//                 showPopup(
//                     form.id === "loginForm" ? "Login Failed" : "Registration Failed",
//                     errors.join(" <br>"),
//                     false
//                 );
//             }
//         };
//         form.addEventListener("submit", form._submitHandler);
//     });
// }



// // Form toggle
// toggleBtn.addEventListener("click", () => {
//     isLogin = !isLogin;

//     if (isLogin) {
//         switchToLogin();
//     } else {
//         signupForm.classList.remove("hidden");
//         loginForm.classList.add("hidden");
//         formSection.style.transform = "translateX(0)";
//         sidePanel.style.transform = "translateX(0)";
//         sidePanel.classList.remove("rounded-r-[100px]");
//         sidePanel.classList.add("rounded-l-[100px]");
//         panelTitle.textContent = "Welcome! to Good Neews!";
//         panelDesc.textContent = "Manage your pharmacy with our professional admin tools";
//         toggleBtn.textContent = "Login";

//         [signupForm, loginForm].forEach(form => {
//             clearErrors(form);
//             form.reset();
//             form.querySelectorAll("input").forEach(input => {
//                 input.disabled = false;
//                 input.readOnly = false;
//                 input.style.pointerEvents = "auto";
//             });
//         });

//         setupValidation();
//         setupFormSubmission();
//         setupTogglePassword();
//     }
// });

// // Initialize functionality
// document.addEventListener("DOMContentLoaded", () => {
//     [signupForm, loginForm].forEach(form => {
//         form.querySelectorAll("input").forEach(input => {
//             input.disabled = false;
//             input.readOnly = false;
//             input.style.pointerEvents = "auto";
//         });
//     });

//     setupTogglePassword();
//     setupValidation();
//     setupFormSubmission();

//     // === FORCE DEFAULT TO LOGIN FORM ON PAGE LOAD ===
//     switchToLogin();
// });

// console.log("login.js loaded and initialized");