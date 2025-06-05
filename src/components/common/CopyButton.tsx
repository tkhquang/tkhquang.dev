"use client";

const CopyButton = (props: React.ComponentProps<"button">) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const valueToCopy = button.getAttribute("data-value")!;
    const feedBackDuration = button.getAttribute("data-duration")!;
    navigator.clipboard.writeText(valueToCopy);
    button.classList.add("rehype-pretty-copied");
    setTimeout(
      () => button.classList.remove("rehype-pretty-copied"),
      +feedBackDuration
    );
  };

  return <button {...props} onClick={handleClick} className="hidden" />;
};

export default CopyButton;
