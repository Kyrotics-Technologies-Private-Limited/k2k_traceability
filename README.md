# K2K Traceability System

A comprehensive blockchain-inspired traceability system for natural products, built with Next.js 14, Firebase, and modern web technologies. This system enables end-to-end product tracking from manufacturing to consumer verification.

## 🌟 Features

### 🔐 Authentication & Security
- **Firebase Authentication** with session persistence
- **Secure API endpoints** with environment-based configuration
- **Role-based access control** (Admin/Customer interfaces)

### 📦 Product Management
- **Product Catalog Management** - Add, edit, and manage product categories
- **Image Upload & Storage** - Firebase Storage integration for product images
- **Product Details Tracking** - Comprehensive product information storage

### 🏭 Batch Management
- **Batch Creation & Tracking** - Create production batches with unique identifiers
- **Test Report Integration** - Upload and link quality test reports to batches
- **Batch History** - Complete audit trail of all batch operations

### 📋 Packet Generation & Tracking
- **Automated Packet Generation** - Generate individual packets from batches
- **Unique Serial Numbers** - Each packet gets a unique traceable identifier
- **Refractometer Reports** - Quality measurement integration per packet

### 🔍 Customer Verification
- **Real-time Product Verification** - Customers can verify product authenticity
- **Serial Number Lookup** - Instant access to product traceability data
- **Quality Reports Access** - View test reports and quality metrics

### 🎨 Modern UI/UX
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Dark Mode Support** - Complete dark/light theme implementation
- **Smooth Animations** - Framer Motion integration for enhanced UX
- **Accessibility** - WCAG compliant components and interactions

## 🏗️ Architecture

### Frontend Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

### Backend & Database
- **Firebase Firestore** - NoSQL cloud database
- **Firebase Storage** - File storage for images and reports
- **Firebase Authentication** - User authentication system
- **Firebase Functions** - Serverless backend functions

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **UUID** - Unique identifier generation
- **XLSX** - Excel file processing capabilities

## 📁 Project Structure

```
k2k_traceability/
├── firebase/                    # Firebase configuration and utilities
│   ├── auth.tsx                # Authentication utilities
│   ├── firebaseConfig.tsx      # Firebase app configuration
│   └── firebaseUtil.tsx        # Database operations and utilities
├── public/                     # Static assets
│   ├── cowghee.webp           # Product images
│   ├── honey.webp
│   ├── tea.webp
│   ├── TeaP.webp
│   └── grid.svg               # Background patterns
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── admin/             # Admin interface
│   │   │   ├── [productId]/   # Product-specific admin pages
│   │   │   │   ├── create_batch/
│   │   │   │   ├── [batchId]/
│   │   │   │   │   ├── batch_details/
│   │   │   │   │   ├── existing_packets/
│   │   │   │   │   └── add_refractometer_report/
│   │   │   ├── add_product/   # Product creation
│   │   │   └── add_serialno/  # Serial number management
│   │   ├── customer/          # Customer verification interface
│   │   │   └── [serialNo]/    # Product verification results
│   │   ├── login/             # Authentication pages
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/            # Reusable UI components
│   │   └── ui/               # Shadcn/ui components
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── skeleton.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   └── lib/                   # Utility functions
│       └── utils.ts          # Common utilities
├── components.json           # Shadcn/ui configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── next.config.mjs          # Next.js configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Firebase project** with Firestore and Storage enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd k2k_traceability
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Firebase Setup**
   - Create a new Firebase project
   - Enable Firestore Database
   - Enable Firebase Storage
   - Enable Authentication (Email/Password)
   - Configure security rules for Firestore and Storage

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Admin Interface (`/admin`)

#### Product Management
1. **Add New Product**
   - Click "Add new Product" button
   - Enter product name and details
   - Upload product image
   - Submit to create product category

2. **Create Batches**
   - Select a product from the admin dashboard
   - Click "Create New Batch"
   - Set batch quantity limit
   - Upload test report (optional)
   - Generate batch with unique identifier

3. **Manage Packets**
   - Navigate to batch details
   - Generate packets from batch
   - Add refractometer reports to individual packets
   - Track packet distribution

#### Batch Operations
- **Batch Details**: View comprehensive batch information
- **Packet Generation**: Create individual packets with unique serial numbers
- **Quality Reports**: Upload and manage test reports
- **Inventory Tracking**: Monitor packet status and distribution

### Customer Interface (`/customer`)

#### Product Verification
1. **Enter Serial Number**
   - Navigate to customer verification page
   - Enter the serial number from product packaging
   - Click "Verify Product"

2. **View Results**
   - Product details and image
   - Batch information and manufacturing date
   - Quality test reports
   - Refractometer readings
   - Authenticity verification

## 🔧 API Reference

### Firebase Utilities (`firebase/firebaseUtil.tsx`)

#### Product Management
```typescript
// Add new product
addProduct(productName: string, productDetails: string, productImage: File | null)

// Fetch all product categories
fetchProductCategories()

// Fetch specific product
fetchProductByProductId(productId: string)
```

#### Batch Management
```typescript
// Add batch to product
addBatchToProduct(productId: string, limitQuantity: number, testReport: File | null)

// Fetch batches for product
fetchBatchesByProductId(productId: string)

// Get batch details
fetchBatchDetails(productId: string, batchId: string)
```

#### Packet Operations
```typescript
// Generate packets from batch
generatePackets(productId: string, batchId: string, quantity: number)

// Add refractometer report
addRefractometerReport(productId: string, batchId: string, packetId: string, report: string)

// Fetch packet details
fetchPacketDetails(productId: string, batchId: string)
```

#### Customer Verification
```typescript
// Fetch customer details by serial number
fetchCustomerDetails(serialNo: string)

// Fetch customer details with enhanced data
fetchCustomerDetailsBySerialNo(serialNo: string)
```

## 🎨 UI Components

The project uses a comprehensive set of UI components built with Radix UI primitives and styled with Tailwind CSS:

- **Alert** - Status notifications and warnings
- **Badge** - Status indicators and labels
- **Button** - Interactive elements with variants
- **Card** - Content containers with headers
- **Dialog** - Modal overlays and forms
- **Input** - Form input fields
- **Label** - Form field labels
- **Select** - Dropdown selection components
- **Skeleton** - Loading state placeholders
- **Table** - Data display components
- **Tabs** - Tabbed interface components
- **Textarea** - Multi-line text input

## 🔒 Security Features

- **Environment Variables** - Sensitive configuration stored in `.env.local`
- **Firebase Security Rules** - Database and storage access control
- **Session Persistence** - Secure authentication state management
- **Input Validation** - Client and server-side validation
- **File Upload Security** - Secure file handling and storage

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Environment Variables for Production
Ensure all Firebase configuration variables are set in your production environment:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 🧪 Testing

### Development Testing
```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Development server
npm run dev
```

### Production Testing
```bash
# Build application
npm run build

# Start production server
npm start
```

## 📊 Database Schema

### Firestore Collections

#### `productCategory`
```typescript
{
  productCategoryId: string,    // Auto-incremented ID (001, 002, etc.)
  productName: string,          // Product name
  productDetails: string,       // Product description
  productImage: string          // Firebase Storage URL
}
```

#### `productCategory/{productId}/batches`
```typescript
{
  batchNo: string,              // Auto-incremented batch number
  limitQuantity: number,        // Maximum packets in batch
  testReport: string            // Firebase Storage URL to test report
}
```

#### `productCategory/{productId}/batches/{batchId}/packets`
```typescript
{
  serialNo: string,             // Unique serial number
  packetNo: string,             // Packet number within batch
  refractometerReport: string   // Quality measurement data
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement responsive design
- Add proper error handling
- Include loading states
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the Firebase documentation for backend issues

## 🔄 Version History

- **v0.1.0** - Initial release with basic traceability features
- Product management and batch tracking
- Customer verification interface
- Firebase integration
- Modern UI with Tailwind CSS

## 🎯 Roadmap

- [ ] **QR Code Integration** - Generate QR codes for products
- [ ] **Mobile App** - Native mobile application
- [ ] **Analytics Dashboard** - Product performance metrics
- [ ] **Export Functionality** - Data export to Excel/PDF
- [ ] **Multi-language Support** - Internationalization
- [ ] **Advanced Reporting** - Custom report generation
- [ ] **API Documentation** - Swagger/OpenAPI documentation
- [ ] **Unit Testing** - Comprehensive test coverage
- [ ] **E2E Testing** - End-to-end testing with Playwright
- [ ] **Performance Optimization** - Code splitting and caching

---

**Built with ❤️ using Next.js, Firebase, and modern web technologies**


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
