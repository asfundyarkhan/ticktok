"use client";

import React, { useState } from "react";
import { FormEvent } from "react";
import styles from "./register.module.css";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [nameError, setNameError] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let hasError = false;

    if (!email) {
      setEmailError(true);
      hasError = true;
    }
    if (!fullName) {
      setNameError(true);
      hasError = true;
    }

    if (hasError) return;
    // TODO: Implement registration logic
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
          <h1 className={styles.formTitle}>Create an account</h1>
          <p className={styles.loginText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.loginLink}>
              Log in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setNameError(false);
                }}
                placeholder="Full Name"
                className={`${styles.input} ${nameError ? styles.error : ""}`}
              />
              {nameError && (
                <div className={styles.errorText}>Full name is required</div>
              )}
            </div>

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
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
