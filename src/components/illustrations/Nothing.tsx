export default function Nothing({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-12 text-center text-concrete rounded-lg bg-concrete/30">
      <img
        src="/nothing.png"
        alt="Nothing to see"
        className="w-52 h-52 object-contain mx-auto"
      />
      <p className="text-sm text-thunder relative right-6">{children}</p>
    </div>
  );
}
