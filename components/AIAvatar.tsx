'use client';

interface AIAvatarProps {
  isSpeaking?: boolean;
}

export default function AIAvatar({ isSpeaking = false }: AIAvatarProps) {
  return (
    <div className={`ai-avatar-container ${isSpeaking ? 'speaking' : ''}`}>
      <div className="avatar-orb">
        <div className="orb-inner"></div>
        <div className="orb-glow"></div>
      </div>
      <div className="avatar-ring">
        <div className="ring-segment"></div>
        <div className="ring-segment"></div>
        <div className="ring-segment"></div>
        <div className="ring-segment"></div>
      </div>
    </div>
  );
}