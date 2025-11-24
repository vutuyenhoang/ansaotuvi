const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/tu-vi', async (req, res) => {
  try {
    const { name, day, month, year, hour, minute, gender, year_xem = new Date().getFullYear() } = req.body;

    const params = new URLSearchParams({
      name: name || 'Người dùng',
      isLunar: '',
      day, month, year,
      gio: hour,
      phut: minute || '00',
      fixhour: '0',
      gender: gender,
      year_xem: year_xem.toString(),
      submit: 'Submit'
    });

    const fullUrl = 'http://phongthuy.xemtuong.net/an_sao_tu_vi/index.php?' + params.toString();

    // Thêm headers giả lập trình duyệt để bypass chặn
    const response = await axios.get(fullUrl, {
      timeout: 30000, // Tăng timeout lên 30s
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.data || response.data.includes('Error') || response.data.length < 1000) {
      throw new Error('Trang nguồn không trả dữ liệu hợp lệ (có thể đang bảo trì).');
    }

    const $ = cheerio.load(response.data);
    
    // Loại bỏ các phần thừa kỹ hơn
    $('script, style, header, footer, nav, iframe, .ads, .menu, form, .sidebar, .footer').remove();
    $('body').find('table').css({ width: '100%', borderCollapse: 'collapse' }); // Giữ table lá số đẹp

    const cleanHtml = `
      <div style="font-family: Arial, sans-serif; background: white; padding: 20px; border-radius: 10px;">
        ${$('body').html()}
      </div>
    `;

    res.json({
      success: true,
      html: cleanHtml,
      url: fullUrl
    });

  } catch (error) {
    console.error('Lỗi chi tiết:', error.message);
    let errorMsg = 'Không thể lấy lá số lúc này. ';
    if (error.code === 'ECONNABORTED') {
      errorMsg += 'Trang nguồn quá chậm. ';
    } else if (error.response && error.response.status >= 400) {
      errorMsg += 'Trang nguồn từ chối request (có thể chặn IP). ';
    } else {
      errorMsg += error.message;
    }
    errorMsg += 'Thử lại sau 5-10 phút hoặc dùng link trực tiếp bên dưới.';
    
    res.status(500).json({ 
      success: false, 
      message: errorMsg,
      directLink: 'http://phongthuy.xemtuong.net/an_sao_tu_vi/index.php?' + new URLSearchParams({
        name: req.body.name || 'Người dùng',
        isLunar: '',
        day: req.body.day,
        month: req.body.month,
        year: req.body.year,
        gio: req.body.hour,
        phut: req.body.minute || '00',
        fixhour: '0',
        gender: req.body.gender,
        year_xem: req.body.year_xem,
        submit: 'Submit'
      }).toString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
