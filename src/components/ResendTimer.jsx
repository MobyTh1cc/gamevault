const ResendTimer = ({ onResend }) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (countdown > 0) {
    return (
      <p style={{ color: 'var(--text3)', fontSize: '.83rem' }}>
        Resend in <span style={{ color: 'var(--text1)', fontWeight: 600 }}>{countdown}s</span>
      </p>
    );
  }

  return (
    <button onClick={() => { setCountdown(60); onResend(); }}
      style={{ background: 'none', border: 'none', color: 'var(--cyan)', fontSize: '.84rem', cursor: 'pointer', fontWeight: 600 }}>
      Resend Code
    </button>
  );
};