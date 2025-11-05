import React from "react";

const Subscribe = ({ className }: React.ComponentProps<"div">) => {
  return (
    <div className={className}>
      <p className="mx-auto text-center">
        <strong>Get rekt!</strong>
        &nbsp;
        {`I'll send new posts to your inbox.`}
      </p>
      {/* <form
        id="SubscriptionForm"
        className="email-form flex-center relative flex w-full flex-wrap pt-5 text-center"
        action="https://buttondown.com/api/emails/embed-subscribe/ljoss"
        method="POST"
        target="_self"
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const formElement = (document.forms as any).SubscriptionForm;
          var formData = new FormData(formElement);
          const { email } = Object.fromEntries(formData);

          try {
            const response = await fetch(
              "https://buttondown.com/api/emails/embed-subscribe/ljoss",
              {
                body: JSON.stringify({
                  email,
                }),
                headers: {
                  "Content-Type": "application/json",
                },
                method: "POST",
              }
            );

            const responseData = await response.json();
            if (responseData.success === true) {
              window.alert(
                "Thank you for subscribing! Please check your email to confirm your subscription."
              );
            } else {
              Promise.reject();
            }
          } catch (error: any) {
            console.error("Error submitting form:", error);
            window.alert("Error submitting form: An error occurred.");
          }
        }}
      >
        <label htmlFor="bd-email" className="absolute inset-0 z-(--z-bg) opacity-0">
          Your email
        </label>
        <input
          id="bd-email"
          className="input mb-5 h-10 w-full px-2"
          type="email"
          name="email"
          placeholder="your-email@address.ex"
          required
        />
        <button type="submit" className="button w-32">
          Subscribe
        </button>
      </form> */}
      <div className="email-form flex-center relative flex w-full flex-wrap pt-5 text-center">
        <a
          href="https://buttondown.com/ljoss"
          target="_blank"
          rel="noopener noreferrer"
        >
          <button type="button" className="button w-32">
            Subscribe
          </button>
        </a>
      </div>
    </div>
  );
};

export default Subscribe;
