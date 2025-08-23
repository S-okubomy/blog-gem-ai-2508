import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-rose-100 text-rose-800 text-sm mt-auto container mx-auto px-6 py-4 text-center">
      <p className="font-semibold">
        当サイトの記事は、AIアシスタントの協力のもと作成しており、一部フィクションが含まれる場合があります。
      </p>
      <p className="mt-2">
        楽しみながらご覧いただけると嬉しいです！掲載された情報のご利用は、ご自身の判断と責任でお願いいたします♪
      </p>
    </footer>
  );
};

export default Footer;
