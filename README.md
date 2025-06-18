### 🧳 Traveloke - Travel Experience Web App

A travel destination web application built with **React + Vite**, connected to the **Travel Journal API** to display **banners, promotions, travel activities, and categories**.Features include wishlist functionality, dark mode, filtering, search, and responsive UI with comprehensive admin dashboard.

---

## 🚀 Main Features

- 🌄 **Banner Slider**: Showcase destination banners with carousel
- 🧭 **Activities List**: Data from Travel API
- 🛍️ **Local Wishlist**: Add/remove from localStorage
- 🧩 **Filter & Search**:

- Filter by category
- Search by activity name



- 🎁 **Promo Section**: Display Ramadan and general promotions
- 🧱 **Responsive Design**: Support for mobile, tablet, laptop and desktop
- 🛒 **Shopping Cart**: Add activities to cart and checkout
- 👤 **User Authentication**: Register and login functionality
- 📊 **Admin Dashboard**: Comprehensive management system


---

## 🛠️ Technologies & Tools

| Tool/Library | Function
|-----|-----
| React + Vite | Frontend framework & bundler
| Tailwind CSS | Utility-first styling
| Heroicons | UI icons (Sun/Moon, Hamburger, etc.)
| Axios | HTTP requests (API access)
| react-router-dom | Page routing
| react-hot-toast | Wishlist and system notifications
| react-slick | Carousel slider for banners
| slick-carousel | CSS carousel (required for `react-slick`)
| localStorage | Store local wishlist data
| Context API | State management (Auth, Cart, Theme)


API Endpoint: [https://travel-journal-api-bootcamp.do.dibimbing.id](https://travel-journal-api-bootcamp.do.dibimbing.id)

---

## 📋 Installation & Setup

```shellscript
# Clone the repository
git clone https://github.com/yourusername/traveloke.git

# Navigate to project directory
cd traveloke

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📁 Project Structure

```plaintext
traveloke/
├── src/
│   ├── api/              # API service functions
│   ├── components/       # Reusable UI components
│   │   ├── admin/        # Admin-specific components
│   ├── contexts/         # React Context providers
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin dashboard pages
│   ├── App.jsx           # Main application component
│   └── main.jsx          # Application entry point
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

---

## 👑 Admin Features

- 📊 **Dashboard**: Overview of users, promos, destinations, categories, banners, and transactions
- 👥 **User Management**: View and manage user accounts
- 🏷️ **Promo Management**: Create, edit, and delete promotional offers
- 🌍 **Destination Management**: Manage travel activities and destinations
- 📂 **Category Management**: Organize activities with categories
- 🖼️ **Banner Management**: Control homepage banner displays
- 💰 **Transaction Management**: Track and manage user transactions


---

## 🖥️ Preview

*Note: Replace with actual screenshots of your application*

---

## 🔑 API Integration

The application connects to the Travel Journal API for all data operations. Key endpoints include:

- Authentication (login/register)
- Banners management
- Categories management
- Activities/destinations
- Promotions
- User profiles
- Transactions


Full API documentation available at: [https://travel-journal-api-bootcamp.do.dibimbing.id/api-docs](https://travel-journal-api-bootcamp.do.dibimbing.id/api-docs)

---

## 🌟 Features in Detail

### User Features

- **Registration**: Create account with role selection (user/admin)
- **Authentication**: Secure login with JWT
- **Profile Management**: Update personal information
- **Wishlist**: Save favorite destinations
- **Shopping Cart**: Add activities and complete purchases
- **Transaction History**: View past bookings and purchases


### Admin Features

- **Comprehensive Dashboard**: Visual statistics of all system data
- **Content Management**: Full CRUD operations for all content types
- **User Management**: View and manage user accounts
- **Transaction Tracking**: Monitor all system transactions


---

## 👨‍💻 Contributors

- Muhsin Sutanto - Frontend web developper as a mentor
- Abdullah - Frontend web developper #21 as a student


---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.