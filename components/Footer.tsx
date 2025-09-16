import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-8 mt-auto">
      <div className="container mx-auto text-center text-xs text-slate-500">
        <p>
          제공:{' '}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="font-semibold text-slate-600 hover:text-sky-500 transition-colors"
          >
            Regulaw
          </a>{' '}
          - 안전 규정 준수를 위한 AI.
        </p>
      </div>
    </footer>
  );
};

export default Footer;