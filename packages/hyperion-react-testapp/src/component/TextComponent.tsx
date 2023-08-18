export default function TextComponent() {
  return (
    <div onClick={(_) => null}>
      <span>Text Span (Clicking Text Should Resolve to reactComponentName:TextComponent, while interactable element:div)</span>
    </div>
  );
}
