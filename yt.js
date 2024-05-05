const axios = require('axios');

const options = {
  method: 'GET',
  url: 'https://youtube-mp315.p.rapidapi.com/',
  params: {
    url: 'https://www.youtube.com/watch?v=OzYsl3wMBQ0'
  },
  headers: {
    'X-RapidAPI-Key': 'dbaf2ac952mshd7bd464c72fc0a1p137301jsnac4c8ddd0d03',
    'X-RapidAPI-Host': 'youtube-mp315.p.rapidapi.com'
  }
};

async function fetchData() {
  try {
    const response = await axios.request(options);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

fetchData();
