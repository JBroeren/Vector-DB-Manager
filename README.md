# W-Manager 🗄️

A modern, intuitive web-based management interface for Weaviate vector databases. Built with Next.js 13+, TypeScript, and shadcn/ui.

![W-Manager Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Weaviate](https://img.shields.io/badge/Weaviate-Compatible-orange)

## ✨ Features

### 📊 **Comprehensive Statistics Dashboard**
- **Real-time database metrics** with auto-refresh
- **Cluster health monitoring** with node status indicators
- **Performance metrics** tracking (batch rates, indexing queues)
- **Shard-level details** for granular insights
- **Collection analytics** with object counts and properties

### 🗂️ **Collection Management**
- **Create/Delete collections** with custom properties
- **Schema management** with multiple data types
- **Real-time collection statistics**
- **Property configuration** (string, number, boolean, text)

### 📝 **Object Operations**
- **CRUD operations** for vector objects
- **Bulk operations** (select multiple, bulk delete)
- **Advanced object viewer** with JSON formatting
- **Property editing** with type validation
- **Pagination** for large datasets

### 🔍 **Advanced Search**
- **Vector similarity search** (nearText)
- **Text-based property search** with filtering
- **Real-time search results**
- **Search result highlighting**

### 🎨 **Modern UI/UX**
- **Dark/Light/System theme** support
- **Responsive design** for all screen sizes
- **Compact layout** optimized for productivity
- **Real-time status indicators**
- **Intuitive navigation** with tabbed interface

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Weaviate instance** (local or cloud)
- **API key** (if authentication enabled)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/w-manager.git
   cd w-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   WEAVIATE_URL=https://your-weaviate-instance.com/v1
   WEAVIATE_API_KEY=your-api-key-here
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📋 Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `WEAVIATE_URL` | ✅ | Weaviate instance URL | `https://vector.example.com/v1` |
| `WEAVIATE_API_KEY` | ⚠️ | API key (if auth enabled) | `eYW4bJKxT932N0eD115d5XMJ...` |

### Weaviate Compatibility

W-Manager supports:
- **Weaviate 1.20+** (recommended)
- **Single-node** and **multi-node clusters**
- **Authentication** (API key-based)
- **Text vectorization modules** (text2vec-*)
- **Custom schemas** and **properties**

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 13+ with App Router
- **UI Components**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Database Client**: Weaviate TypeScript SDK
- **State Management**: React hooks + localStorage

### Project Structure
```
w-manager/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   └── weaviate/      # Weaviate API endpoints
│   │   ├── globals.css        # Global styles
│   │   └── page.tsx           # Main application
│   ├── components/ui/         # shadcn/ui components
│   └── lib/
│       ├── utils.ts           # Utility functions
│       └── weaviate.ts        # Weaviate service layer
├── .env.local                 # Environment configuration
└── package.json              # Dependencies
```

## 🔧 API Endpoints

### Statistics
- `GET /api/weaviate/stats` - Basic database statistics
- `GET /api/weaviate/enhanced-stats` - Advanced cluster metrics
- `GET /api/weaviate/status` - Connection health check

### Collections
- `GET /api/weaviate/classes` - List all collections
- `POST /api/weaviate/schema` - Create new collection
- `DELETE /api/weaviate/classes/[className]` - Delete collection

### Objects
- `GET /api/weaviate/objects/[className]` - Get objects
- `POST /api/weaviate/objects/[className]` - Create object
- `PUT /api/weaviate/objects/[className]/[id]` - Update object
- `DELETE /api/weaviate/objects/[className]/[id]` - Delete object

### Search
- `POST /api/weaviate/search` - Vector and text search

## 📊 Dashboard Features

### Statistics Overview
- **Database metrics**: Collections, objects, version info
- **Cluster health**: Node status, synchronization state
- **Performance**: Batch rates, indexing queues, shard status
- **Real-time updates** with manual refresh

### Collection Browser
- **Two-panel layout**: Collections sidebar + Objects view
- **Interactive tables** with sorting and filtering
- **Bulk operations** with multi-select
- **Modal dialogs** for detailed object viewing/editing

## 🎨 Theming

W-Manager includes a built-in theme switcher with three options:

- **🌞 Light Mode**: Clean, minimal design
- **🌙 Dark Mode**: Easy on the eyes
- **💻 System**: Follows OS preference

Themes are persisted in localStorage and applied instantly.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines
- Use **TypeScript** for type safety
- Follow **ESLint** configuration
- Write **descriptive commit messages**
- Update **documentation** for new features

## 🐛 Troubleshooting

### Common Issues

**Connection Failed**
- Verify Weaviate URL in `.env.local`
- Check if Weaviate instance is running
- Ensure API key is correct (if using authentication)

**Objects Not Displaying**
- Check browser console for errors
- Verify collection exists and has objects
- Try refreshing the connection

**Search Not Working**
- Ensure collection has searchable text properties
- Check if text vectorization module is enabled
- Try using exact property names in search

### Debug Mode
Enable debug logging by adding to `.env.local`:
```env
NODE_ENV=development
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Weaviate** team for the excellent vector database
- **Vercel** for Next.js and deployment platform
- **shadcn** for the beautiful UI component library
- **Lucide** for the icon set

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/w-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/w-manager/discussions)
- **Documentation**: [Weaviate Docs](https://weaviate.io/developers/weaviate)

---

**Built with ❤️ for the Weaviate community**