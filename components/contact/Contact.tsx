"use client";

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

interface FormValues {
  name: string;
  email: string;
  message: string;
}

const Contact = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const [status, setStatus] = useState<"fetching" | "success" | "error" | "">(
    ""
  );
  const [errorMessage, setErrorMessage] = useState("");

  const encode = (data: Record<string, string>) =>
    Object.keys(data)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
      )
      .join("&");

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setStatus("fetching");

    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({
          "form-name": "portfolio-dev",
          ...data,
        }),
      });

      setStatus("success");
      reset(); // Clear form fields
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
    <section className="contact mt-10 py-10">
      <div className="container">
        <h2 className="heading--section mb-10 text-4xl">Contact 📨</h2>
        <div className="mx-auto w-full md:w-2/3">
          <form
            className="email-form flex-center relative flex w-full flex-wrap overflow-hidden pt-5 text-center"
            name="portfolio-dev"
            method="POST"
            data-netlify="true"
            data-netlify-honeypot="bot-field"
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off"
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
                <div className="mb-5 w-full">
                  <label htmlFor="name" className="sr-only">
                    Full name
                  </label>
                  <input
                    id="name"
                    className={`input h-10 min-w-full px-2 ${
                      errors.name ? "border-red-500" : ""
                    }`}
                    type="text"
                    placeholder="Full name*"
                    {...register("name", { required: "Full name is required" })}
                    required
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="mb-5 w-full">
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    className={`input h-10 min-w-full px-2 ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    type="email"
                    placeholder="Email*"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value:
                          /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                        message: "Invalid email address",
                      },
                    })}
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="mb-5 w-full">
                  <label htmlFor="message" className="sr-only">
                    Message
                  </label>
                  <textarea
                    id="message"
                    className={`textarea min-w-full p-2 ${
                      errors.message ? "border-red-500" : ""
                    }`}
                    placeholder="Message*"
                    rows={5}
                    {...register("message", {
                      required: "Message is required",
                    })}
                    required
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="button w-32"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex-center">
                      <svg
                        className="spinner size-4 animate-spin"
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
                    "Submit"
                  )}
                </button>
              </>
            )}

            {status === "success" && (
              <div className="space-y-4 text-theme-success">
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
                  className="button mx-auto"
                  onClick={retryHandler}
                >
                  Retry
                </button>
              </div>
            )}

            {status === "error" && (
              <div className="text-theme-error">
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
                  className="button mx-auto"
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
