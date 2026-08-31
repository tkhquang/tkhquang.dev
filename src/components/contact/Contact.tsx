"use client";

import SectionHeading from "@/components/common/SectionHeading";
import SocialLinks from "@/components/common/SocialLinks";
import HeroWaves from "@/components/landing/hero/HeroWaves";
import classNames from "classnames";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

interface FormValues {
  name: string;
  email: string;
  message: string;
}

const FORM_API_ENDPOINT = "https://api.web3forms.com/submit";

const INPUT_CLASS =
  "border-theme-hairline-soft bg-theme-background text-theme-on-background focus:border-theme-primary focus:outline-theme-primary/50 w-full rounded-lg border px-3 py-2.5 shadow-inner transition-colors duration-200 focus:outline-2";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold tracking-wider uppercase opacity-75";

const Contact = () => {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<FormValues>();

  const [status, setStatus] = useState<"fetching" | "success" | "error" | "">(
    ""
  );
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setStatus("fetching");

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
      if (responseData.success === true) {
        setStatus("success");
        reset();
      } else {
        Promise.reject();
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setStatus("error");
      setErrorMessage(
        error?.response?.data?.message || error.message || "An error occurred."
      );
    }
  };

  const retryHandler = () => {
    setStatus("");
    setErrorMessage("");
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
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
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
            <SocialLinks className="mt-8 flex items-center gap-4 text-3xl" />
          </div>

          <form
            className="email-form bg-theme-raised border-theme-hairline-soft text-theme-on-surface rounded-xl border p-6 shadow-md"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* Hidden field for bot prevention */}
            <div hidden aria-hidden="true">
              <label>
                {`Don't fill this out if you're human:`}
                <input name="bot-field" />
              </label>
            </div>

            {(!status || status === "fetching") && (
              <>
                <div className="mb-4">
                  <label htmlFor="name" className={LABEL_CLASS}>
                    Full name
                  </label>
                  <input
                    id="name"
                    className={classNames(INPUT_CLASS, {
                      "border-theme-error": errors.name,
                    })}
                    type="text"
                    autoComplete="name"
                    {...register("name", { required: "Full name is required" })}
                    required
                  />
                  {errors.name && (
                    <p className="text-theme-error mt-1 text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className={LABEL_CLASS}>
                    Email
                  </label>
                  <input
                    id="email"
                    className={classNames(INPUT_CLASS, {
                      "border-theme-error": errors.email,
                    })}
                    type="email"
                    autoComplete="email"
                    {...register("email", {
                      pattern: {
                        message: "Invalid email address",
                        value:
                          /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      },
                      required: "Email is required",
                    })}
                    required
                  />
                  {errors.email && (
                    <p className="text-theme-error mt-1 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="mb-5">
                  <label htmlFor="message" className={LABEL_CLASS}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    className={classNames(INPUT_CLASS, "resize-y", {
                      "border-theme-error": errors.message,
                    })}
                    rows={5}
                    {...register("message", {
                      required: "Message is required",
                    })}
                    required
                  />
                  {errors.message && (
                    <p className="text-theme-error mt-1 text-sm">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="bg-theme-primary text-theme-on-primary w-full cursor-pointer rounded-lg py-2.5 font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:pointer-events-none disabled:opacity-60"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex-center">
                      <svg
                        className="spinner size-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
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
                    </span>
                  ) : (
                    <>
                      Send it <span aria-hidden="true">📨</span>
                    </>
                  )}
                </button>
              </>
            )}

            {status === "success" && (
              <div className="text-theme-success space-y-4 text-center">
                <p className="space-x-2">
                  <svg
                    className="inline-block size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8a8 8 0 11-16 0 8 8 0 0116 0zM6.58 10.707l4.77-4.77a.5.5 0 10-.708-.708L6.58 9.293 4.354 7.068a.5.5 0 10-.708.708l2.933 2.931z" />
                  </svg>
                  <span>
                    Your message has been successfully sent, I will get back to
                    you ASAP!
                  </span>
                </p>
                <button
                  type="button"
                  className="text-theme-primary mx-auto cursor-pointer font-semibold"
                  onClick={retryHandler}
                >
                  Send another
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="text-theme-error text-center">
                <p className="space-x-2">
                  <svg
                    className="inline-block size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.93-6.588l-2.4 2.4a.533.533 0 01-.754 0L4.07 9.412a.533.533 0 01.754-.754L8 11.524l2.676-2.676a.533.533 0 11.754.754z" />
                  </svg>
                  <span>Error, please try again!</span>
                </p>
                <p className="my-2">{errorMessage}</p>
                <button
                  type="button"
                  className="text-theme-primary mx-auto cursor-pointer font-semibold"
                  onClick={retryHandler}
                >
                  Retry
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
