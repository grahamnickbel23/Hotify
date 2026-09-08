const fs = require('fs');
const file = 'd:/ZT 130825/Pogramme Files/website/portfolio/hotify/website/src/components/MainContent.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /song\.coverUrl \? `url\(\$\{song\.coverUrl\}\) center\/cover no-repeat` : 'linear-gradient\(135deg, #1db954 0%, #191414 100%\)'/g,
  '(song.assetUrl || song.coverUrl) ? `url(${song.assetUrl || song.coverUrl}) center/cover no-repeat` : \\'linear-gradient(135deg, #1db954 0%, #191414 100%)\\''
);
content = content.replace(/!song\.coverUrl && <Music/g, '!(song.assetUrl || song.coverUrl) && <Music');

content = content.replace(
  /fullSong\.coverUrl \? `url\(\$\{fullSong\.coverUrl\}\) center\/cover no-repeat` : 'linear-gradient\(135deg, #1db954 0%, #191414 100%\)'/g,
  '(fullSong.assetUrl || fullSong.coverUrl) ? `url(${fullSong.assetUrl || fullSong.coverUrl}) center/cover no-repeat` : \\'linear-gradient(135deg, #1db954 0%, #191414 100%)\\''
);
content = content.replace(/!fullSong\.coverUrl && <Music/g, '!(fullSong.assetUrl || fullSong.coverUrl) && <Music');

content = content.replace(
  /resolvedSong\.coverUrl \? `url\(\$\{resolvedSong\.coverUrl\}\) center\/cover no-repeat` : 'linear-gradient\(135deg, #1db954 0%, #191414 100%\)'/g,
  '(resolvedSong.assetUrl || resolvedSong.coverUrl) ? `url(${resolvedSong.assetUrl || resolvedSong.coverUrl}) center/cover no-repeat` : \\'linear-gradient(135deg, #1db954 0%, #191414 100%)\\''
);
content = content.replace(/!resolvedSong\.coverUrl && <Music/g, '!(resolvedSong.assetUrl || resolvedSong.coverUrl) && <Music');

content = content.replace(
  /detailedSong\.coverUrl[\s\n]*\?[\s\n]*`url\(\$\{detailedSong\.coverUrl\}\) center\/cover no-repeat`/g,
  '(detailedSong.assetUrl || detailedSong.coverUrl) \n                      ? `url(${detailedSong.assetUrl || detailedSong.coverUrl}) center/cover no-repeat`'
);
content = content.replace(/!detailedSong\.coverUrl && \(/g, '!(detailedSong.assetUrl || detailedSong.coverUrl) && (');

fs.writeFileSync(file, content);
console.log('Done');
