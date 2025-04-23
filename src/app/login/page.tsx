"use client";

import React, { useState, useEffect } from "react";
import { FormEvent } from "react";
import styles from "./login.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    const isAuthenticated = sessionStorage.getItem("isAuthenticated");
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setEmailError(false);

    if (!email) {
      setEmailError(true);
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual authentication API call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      // Mock successful login
      sessionStorage.setItem("isAuthenticated", "true");
      sessionStorage.setItem("userEmail", email);
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.leftSection}>
        <div className={styles.brandContent}>
          <div className={styles.brandTitle}>
            <h1 className={styles.tiktokShop}>TikTok Shop</h1>
            <p className={styles.slogan}>
              Create joy and
              <br />
              sell more
            </p>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.formWrapper}>
          <Link href="/" className={styles.backLink}>
            ← Back to shop
          </Link>
          <h1 className={styles.formTitle}>Log in</h1>
          <p className={styles.loginText}>
            Don't have an account?{" "}
            <Link href="/register" className={styles.loginLink}>
              Register
            </Link>
          </p>

          {error && <div className={styles.errorAlert}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(false);
                }}
                placeholder="Email Address"
                className={`${styles.input} ${emailError ? styles.error : ""}`}
                disabled={loading}
              />
              {emailError && (
                <div className={styles.errorText}>Email is required</div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={styles.input}
                disabled={loading}
              />
            </div>

            <div className={styles.forgotPassword}>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
