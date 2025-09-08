# User Data Structure

## Firestore Collection: `users`

The user data is stored in a Firestore collection called `users` where each document ID is the user's UID.

### Document Structure

```javascript
// Document ID: {uid}
{
  name: "John Doe",                    // User's display name
  email: "john@example.com",           // User's email
  phoneNumber: "+1234567890",          // User's phone number
  role: "admin" | "customer",          // User role
  createdAt: "2024-01-15T10:30:00Z",   // Account creation timestamp
  lastLoginAt: "2024-01-20T14:45:00Z", // Last login timestamp
  updatedAt: "2024-01-20T14:45:00Z"    // Last update timestamp
}
```

### API Endpoints

#### 1. Get User Data
```
GET /api/get-user?uid={uid}
```

**Response:**
```javascript
{
  success: true,
  user: {
    uid: "user123",
    name: "John Doe",
    email: "john@example.com",
    phoneNumber: "+1234567890",
    role: "admin",
    createdAt: "2024-01-15T10:30:00Z",
    lastLoginAt: "2024-01-20T14:45:00Z"
  }
}
```

#### 2. Create/Update User
```
POST /api/create-user
```

**Request Body:**
```javascript
{
  uid: "user123",
  name: "John Doe",
  email: "john@example.com",
  phoneNumber: "+1234567890",
  role: "admin" // optional, defaults to "customer"
}
```

**Response:**
```javascript
{
  success: true,
  message: "User created successfully",
  user: {
    uid: "user123",
    name: "John Doe",
    email: "john@example.com",
    phoneNumber: "+1234567890",
    role: "admin",
    createdAt: "2024-01-15T10:30:00Z",
    lastLoginAt: "2024-01-20T14:45:00Z",
    updatedAt: "2024-01-20T14:45:00Z"
  }
}
```

### How It Works

1. **User Login**: When a user logs in, the system gets their UID from Firebase Auth
2. **Fetch User Data**: The system calls `/api/get-user?uid={uid}` to get user details from Firestore
3. **Display Name**: The navbar shows the user's name from the Firestore document
4. **Role Management**: User roles are stored in Firestore and used for access control

### Fallback Behavior

- If Firestore is not available, the system returns fallback data with name "User"
- If a user document doesn't exist, the system creates a default user document
- If Firebase Admin is not initialized, the system gracefully handles the error

### Setting Up User Data

To set up user data in Firestore, you can:

1. **Use the API**: Call `POST /api/create-user` with user details
2. **Manual Setup**: Create documents directly in Firestore Console
3. **Auto-Creation**: The system will create default documents when needed

### Example User Documents

#### Admin User
```javascript
// Document ID: admin123
{
  name: "Admin User",
  email: "admin@k2k.com",
  phoneNumber: null,
  role: "admin",
  createdAt: "2024-01-01T00:00:00Z",
  lastLoginAt: "2024-01-20T14:45:00Z",
  updatedAt: "2024-01-20T14:45:00Z"
}
```

#### Customer User
```javascript
// Document ID: customer456
{
  name: "John Customer",
  email: "john@example.com",
  phoneNumber: "+1234567890",
  role: "customer",
  createdAt: "2024-01-15T10:30:00Z",
  lastLoginAt: "2024-01-20T14:45:00Z",
  updatedAt: "2024-01-20T14:45:00Z"
}
```
