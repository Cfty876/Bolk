export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'transparent', width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      {children}
    </div>
  );
}
