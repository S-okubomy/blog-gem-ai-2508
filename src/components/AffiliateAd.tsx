import React from 'react';

const AffiliateAd: React.FC = () => {
  const adConfigScript = `
    rakuten_affiliateId="0ea62065.34400275.0ea62066.204f04c0";
    rakuten_items="ranking";
    rakuten_genreId="0";
    rakuten_recommend="on";
    rakuten_design="slide";
    rakuten_size="120x240";
    rakuten_target="_blank";
    rakuten_border="on";
    rakuten_auto_mode="on";
    rakuten_adNetworkId="a8Net";
    rakuten_adNetworkUrl="https%3A%2F%2Frpx.a8.net%2Fsvt%2Fejp%3Fa8mat%3D2C0EMO%2B8DUUSQ%2B2HOM%2BBS629%26rakuten%3Dy%26a8ejpredirect%3D";
    rakuten_pointbackId="a14110686267_2C0EMO_8DUUSQ_2HOM_BS629";
    rakuten_mediaId="20011816";
  `;

  const iframeContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>body { margin: 0; }</style>
      </head>
      <body>
        <script type="text/javascript">${adConfigScript}</script>
        <script type="text/javascript" src="//xml.affiliate.rakuten.co.jp/widget/js/rakuten_widget.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="mt-12 pt-8 border-t border-rose-200 flex flex-col items-center space-y-4">
      <h3 className="text-lg font-semibold text-stone-600">
        ＼ こちらもチェック！ ／
      </h3>
      <div className="flex justify-center">
        <iframe
          srcDoc={iframeContent}
          title="Rakuten Affiliate Ad"
          width="120"
          height="240"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
          loading="lazy"
        />
      </div>
      {/* A8.net tracking pixel */}
      <img
        src="https://www16.a8.net/0.gif?a8mat=2C0EMO+8DUUSQ+2HOM+BS629"
        width="1"
        height="1"
        alt=""
        style={{ border: 'none', position: 'absolute' }}
      />

      {/* New A8.net Ad */}
      <a href="https://px.a8.net/svt/ejp?a8mat=45BUIU+DUXB9E+2BUW+BXYE9" rel="nofollow">
        <img
          width="200"
          height="200"
          alt=""
          src="https://www24.a8.net/svt/bgt?aid=250815558838&wid=003&eno=01&mid=s00000010868002006000&mc=1"
          style={{ border: 'none' }}
        />
      </a>
      <img
        src="https://www11.a8.net/0.gif?a8mat=45BUIU+DUXB9E+2BUW+BXYE9"
        width="1"
        height="1"
        alt=""
        style={{ border: 'none', position: 'absolute' }}
      />
    </div>
  );
};

export default AffiliateAd;
