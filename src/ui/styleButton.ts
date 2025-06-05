export function styleButton(btn: HTMLButtonElement) {
  btn.style.padding = "12px 24px";
  btn.style.fontSize = "20px";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.backgroundColor = "#4e6ef2";
  btn.style.color = "white";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  btn.style.transition = "all 0.2s ease-in-out";

  btn.onmouseenter = () => {
    btn.style.backgroundColor = "#3a52c8";
    btn.style.transform = "scale(1.05)";
  };
  btn.onmouseleave = () => {
    btn.style.backgroundColor = "#4e6ef2";
    btn.style.transform = "scale(1)";
  };
}
