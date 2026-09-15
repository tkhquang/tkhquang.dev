"use client";

import SectionHeading from "@/components/common/SectionHeading";
import SocialLinks from "@/components/common/SocialLinks";
import HeroWaves from "@/components/landing/hero/HeroWaves";
import { cn } from "@/utils/css";
import React, { useRef } from "react";
import { flushSync } from "react-dom";
import { SubmitHandler, useForm } from "react-hook-form";

interface FormValues {
  name: string;
  email: string;
  message: string;
  botcheck?: boolean;
}

const FORM_API_ENDPOINT = "https://api.web3forms.com/submit";

const INPUT_CLASS =
  "border-theme-hairline-soft bg-theme-background text-theme-on-background focus:border-theme-primary focus:outline-theme-primary/50 w-full rounded-lg border px-3 py-2.5 shadow-inner transition-colors duration-200 focus:outline-2";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold tracking-wider uppercase opacity-75";

/*
 * Always rendered at a constant height so validation appearing or clearing
 * never shifts layout; the bottom padding keeps a visible gap between an
 * error message and the next label.
 */
const ERROR_SLOT_CLASS =
  "text-theme-error m-0 min-h-9 pt-1.5 pb-2.5 text-sm leading-5";

const SUCCESS_FEEDBACK = (
  <>
    <span className="text-theme-success font-semibold">
      <svg
        className="mr-1 inline-block size-4 align-text-bottom"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path d="M16 8a8 8 0 11-16 0 8 8 0 0116 0zM6.58 10.707l4.77-4.77a.5.5 0 10-.708-.708L6.58 9.293 4.354 7.068a.5.5 0 10-.708.708l2.933 2.931z" />
      </svg>
      Message sent.
    </span>{" "}
    Thanks for reaching out! I&apos;ll get back to you.
  </>
);

const ERROR_FEEDBACK = "Couldn't send your message. Please try again.";

const Contact = () => {
  const {
    formState: { errors, isSubmitting, isSubmitSuccessful },
    handleSubmit,
    register,
    reset,
    setError,
    setFocus,
  } = useForm<FormValues>({
    defaultValues: { name: "", email: "", message: "", botcheck: false },
  });

  // RHF tracks the UI state; this lock also covers simultaneous submit
  // events during validation, before that state has rendered.
  const submissionPending = useRef(false);
  const isReadOnly = isSubmitting || isSubmitSuccessful;
  const submissionError = errors.root?.server;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      const response = await fetch(FORM_API_ENDPOINT, {
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORM_ACCESS_KEY || "",
          ...data,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const responseData = await response.json();
      if (!response.ok || responseData.success !== true) {
        throw new Error("Contact submission failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // A root error makes RHF mark this submission unsuccessful and is
      // cleared automatically on the next submission.
      setError("root.server", { type: "server", message: ERROR_FEEDBACK });
    }
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    if (submissionPending.current || isSubmitSuccessful) {
      event.preventDefault();
      return;
    }
    submissionPending.current = true;
    try {
      await handleSubmit(onSubmit)(event);
    } finally {
      submissionPending.current = false;
    }
  };

  const sendAnother = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Restore editing before focus, within this click's user gesture, so
    // mobile browsers can open the keyboard for the new message.
    flushSync(() => {
      reset((values) => ({ ...values, message: "" }), { keepFieldsRef: true });
    });
    setFocus("message");
  };

  return (
    <section
      className="contact scroll-mt-header-height band relative overflow-hidden pt-32 pb-16"
      id="contact"
    >
      <HeroWaves
        flip={false}
        fromColor="var(--darken)"
        toColor="var(--darken)"
        gradientId="contact-waves-gradient"
        duration="20s"
        className="absolute inset-x-0 top-0 z-1 h-20"
      />
      <div className="relative z-2 container">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              tone="band"
              kicker="Say hi"
              title="Contact"
              emoji="📨"
              className="mb-6"
            />
            <p className="text-theme-on-band-dim m-0 max-w-md font-serif text-lg italic">
              If you&apos;d like to collaborate or just talk shop, feel free to
              reach out!
            </p>
            <SocialLinks
              className="mt-8 flex items-center gap-4 text-3xl"
              entities={["Github", "LinkedIn"]}
            />
          </div>

          {/*
            noValidate suppresses only the native validation bubble; the
            required attributes stay for semantics while react-hook-form
            renders the styled messages.
          */}
          <form
            className="email-form bg-theme-raised border-theme-hairline-soft text-theme-on-surface rounded-xl border p-6 shadow-md"
            noValidate
            onSubmit={submitForm}
            onReset={sendAnother}
          >
            {/* web3forms discards submissions where botcheck is truthy */}
            <div hidden aria-hidden="true">
              <input type="checkbox" tabIndex={-1} {...register("botcheck")} />
            </div>

            <div>
              <label htmlFor="name" className={LABEL_CLASS}>
                Full name
              </label>
              <input
                id="name"
                className={cn(INPUT_CLASS, {
                  "border-theme-error": errors.name,
                })}
                type="text"
                autoComplete="name"
                required
                readOnly={isReadOnly}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby="contact-name-error"
                {...register("name", { required: "Full name is required" })}
              />
              <p id="contact-name-error" className={ERROR_SLOT_CLASS}>
                {errors.name?.message}
              </p>
            </div>

            <div>
              <label htmlFor="email" className={LABEL_CLASS}>
                Email
              </label>
              <input
                id="email"
                className={cn(INPUT_CLASS, {
                  "border-theme-error": errors.email,
                })}
                type="email"
                autoComplete="email"
                required
                readOnly={isReadOnly}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby="contact-email-error"
                {...register("email", {
                  pattern: {
                    message: "Invalid email address",
                    value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  },
                  required: "Email is required",
                })}
              />
              <p id="contact-email-error" className={ERROR_SLOT_CLASS}>
                {errors.email?.message}
              </p>
            </div>

            <div>
              <label htmlFor="message" className={LABEL_CLASS}>
                Message
              </label>
              <textarea
                id="message"
                className={cn(INPUT_CLASS, "resize-y", {
                  "border-theme-error": errors.message,
                })}
                rows={5}
                required
                readOnly={isReadOnly}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby="contact-message-error"
                {...register("message", {
                  required: "Message is required",
                })}
              />
              <p id="contact-message-error" className={ERROR_SLOT_CLASS}>
                {errors.message?.message}
              </p>
            </div>

            <button
              type={isSubmitSuccessful ? "reset" : "submit"}
              className="bg-theme-primary text-theme-on-primary flex-center focus-visible:outline-theme-primary h-11 w-full cursor-pointer rounded-lg font-semibold shadow-md transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--primary)_82%,var(--on-primary))] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 aria-disabled:cursor-wait aria-disabled:opacity-60"
              aria-disabled={isSubmitting || undefined}
            >
              {isSubmitting ? (
                <span className="flex-center gap-2">
                  <svg
                    className="spinner size-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Sending…
                </span>
              ) : isSubmitSuccessful ? (
                "Send another"
              ) : submissionError ? (
                "Try again"
              ) : (
                <>
                  Send it <span aria-hidden="true">📨</span>
                </>
              )}
            </button>

            <div className="mt-3 grid text-sm leading-5">
              {/* Measure both messages at the current width, including text
                  wrapping, without exposing the sizing copies to readers. */}
              <p
                className="invisible col-start-1 row-start-1 m-0"
                aria-hidden="true"
              >
                {SUCCESS_FEEDBACK}
              </p>
              <p
                className="invisible col-start-1 row-start-1 m-0"
                aria-hidden="true"
              >
                {ERROR_FEEDBACK}
              </p>
              <p
                className="col-start-1 row-start-1 m-0"
                role="status"
                aria-atomic="true"
              >
                {isSubmitting
                  ? "Sending your message…"
                  : isSubmitSuccessful
                    ? SUCCESS_FEEDBACK
                    : null}
              </p>
              <p
                className="text-theme-error col-start-1 row-start-1 m-0"
                role="alert"
                aria-atomic="true"
              >
                {!isSubmitting ? submissionError?.message : null}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
