const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // phục vụ file HTML/CSS/JS

// Endpoint proxy
app.post('/api/tu-vi', async (req, res) => {
  try {
    const { name, day, month, year, hour, minute, gender, year_xem = new Date().getFullYear() } = req.body;

    const url = 'http://phongthuy.xemtuong.net/an_sao_tu_vi/index.php';
    const params = {
      name: name || 'Người dùng',
      isLunar: '',
      day,
      month,
      year,
      gio: hour,
      phut: minute || '00',
      fixhour: 0,
      gender: gender, // 0 = Nam, 1 = Nữ
      year_xem,
      submit: 'Submit'
    };

    const response = await axios.get(url, { params, timeout: 15000 });
    
    // Lọc chỉ lấy phần nội dung lá số (loại bỏ header, menu, quảng cáo...)
    const $ = cheerio.load(response.data);
    
    // Loại bỏ các phần không cần thiết
    $('script, style, header, footer, iframe, .ads, .menu').remove();
    
    // Chỉ giữ lại phần chính chứa lá số
    const content = $('body').html();

    res.json({
      success: true,
      html: content,
      url: response.config.url // trả về link gốc để người dùng có thể chia sẻ
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy lá số Tử Vi. Trang nguồn có thể đang bảo trì hoặc chặn request.'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
