
const axios   = require('axios');
const cheerio = require('cheerio');
const fs      = require('fs');

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function scrapeBing(query, pages = 10) {
  const domains = new Set();

  for (let i = 0; i < pages; i++) {
    const first = i * 10 + 1;                      
    const url =
      `https://www.bing.com/search?q=${encodeURIComponent(query)}` +
      `&first=${first}`;

    console.log(`Fetching page ${i + 1}`);
    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(data);

      $('li.b_algo h2 a').each((_, a) => {
        const href = $(a).attr('href');
        if (!href) return;
        try {
          const host = new URL(href).hostname.replace(/^www\./, '');
          domains.add(host);
        } catch {}
      });

      /* polite pause */
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 500));
    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  if (!domains.size) {
    console.log('\n No domains found something went wrong.');
    return;
  }

  let ip = 2;
  const lines = [];
  for (const host of domains) {
    lines.push(`127.0.0.${ip} ${host}`);
    lines.push(`127.0.0.${ip + 1} www.${host}`);
    ip += 2;
  }

  fs.writeFileSync('sites.txt', lines.join('\n'));
  console.log(`\n🎉  Saved ${domains.size} sites.txt`);
}

const query = process.argv.slice(2).join(' ') ;
scrapeBing(query);
