const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Salon Management Portal API',
      version: '1.0.0',
      description:
        'REST API for the Salon Management Portal. Supports four roles: Customer, Barber, Receptionist, and Admin.',
      contact: {
        name: 'Salon Management Portal',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token from /api/auth/login or /api/auth/register',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error description' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'usr_99823' },
            name: { type: 'string', example: 'Alex Mercer' },
            email: { type: 'string', example: 'alex@example.com' },
            role: {
              type: 'string',
              enum: ['Customer', 'Barber', 'Receptionist', 'Admin'],
              example: 'Customer',
            },
            phone: { type: 'string', example: '9876543215' },
            avatar: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip: { type: 'string' },
              },
            },
            specializations: {
              type: 'array',
              items: { type: 'string' },
              example: ['Haircut', 'Beard Styling'],
            },
            experience: { type: 'number', example: 5 },
            bio: { type: 'string' },
            workingHours: {
              type: 'object',
              properties: {
                start: { type: 'string', example: '09:00' },
                end: { type: 'string', example: '18:00' },
              },
            },
            workingDays: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
              },
            },
            isActive: { type: 'boolean', example: true },
            commissionRate: { type: 'number', example: 30 },
          },
        },
        Service: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Beard Styling' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: ['Haircut', 'Beard Styling', 'Hair Coloring', 'Facial', 'Spa', 'Massage', 'Manicure', 'Pedicure', 'Other'],
              example: 'Beard Styling',
            },
            price: { type: 'number', example: 25.0 },
            duration: { type: 'number', example: 30, description: 'Duration in minutes' },
            image: { type: 'string' },
            isActive: { type: 'boolean', example: true },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            customer: { $ref: '#/components/schemas/User' },
            barber: { $ref: '#/components/schemas/User' },
            service: { $ref: '#/components/schemas/Service' },
            date: { type: 'string', example: '2026-07-15' },
            timeSlot: { type: 'string', example: '14:30' },
            endTime: { type: 'string', example: '15:00' },
            status: {
              type: 'string',
              enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
              example: 'Pending',
            },
            notes: { type: 'string' },
            totalAmount: { type: 'number', example: 25.0 },
            cancellationReason: { type: 'string' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Premium Hair Wax' },
            description: { type: 'string' },
            category: {
              type: 'string',
              enum: ['Hair Care', 'Skin Care', 'Beard Care', 'Styling', 'Tools', 'Accessories', 'Other'],
            },
            price: { type: 'number', example: 18.5 },
            image: { type: 'string' },
            brand: { type: 'string', example: 'StylePro' },
            stockQuantity: { type: 'number', example: 45 },
            isActive: { type: 'boolean' },
            rating: { type: 'number', example: 4.5 },
            numReviews: { type: 'number', example: 23 },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            customer: { $ref: '#/components/schemas/User' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  product: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number' },
                  quantity: { type: 'number' },
                },
              },
            },
            subtotal: { type: 'number' },
            tax: { type: 'number' },
            totalAmount: { type: 'number' },
            status: {
              type: 'string',
              enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
            },
            paymentMethod: {
              type: 'string',
              enum: ['Cash', 'Card', 'UPI', 'Online'],
            },
            paymentStatus: {
              type: 'string',
              enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
            },
            shippingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip: { type: 'string' },
              },
            },
          },
        },
        Inventory: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            itemName: { type: 'string', example: 'Professional Shampoo 1L' },
            category: {
              type: 'string',
              enum: ['Shampoo', 'Hair Wax', 'Hair Color', 'Face Cream', 'Gel', 'Oil', 'Razor', 'Towel', 'Cape', 'Scissors', 'Other'],
            },
            currentStock: { type: 'number', example: 25 },
            minimumStock: { type: 'number', example: 10 },
            unit: {
              type: 'string',
              enum: ['pieces', 'bottles', 'tubes', 'packets', 'liters', 'kg'],
            },
            costPerUnit: { type: 'number', example: 8.5 },
            supplier: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                contact: { type: 'string' },
                email: { type: 'string' },
              },
            },
            isLowStock: { type: 'boolean' },
            lastRestocked: { type: 'string', format: 'date-time' },
          },
        },
        Wage: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            barber: { $ref: '#/components/schemas/User' },
            service: { $ref: '#/components/schemas/Service' },
            date: { type: 'string', example: '2026-07-12' },
            serviceAmount: { type: 'number' },
            commissionRate: { type: 'number' },
            commissionEarned: { type: 'number' },
            tips: { type: 'number' },
            totalEarning: { type: 'number' },
            status: { type: 'string', enum: ['Pending', 'Paid', 'Hold'] },
            month: { type: 'number' },
            year: { type: 'number' },
          },
        },
        TimeOff: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            barber: { $ref: '#/components/schemas/User' },
            startDate: { type: 'string', example: '2026-08-01' },
            endDate: { type: 'string', example: '2026-08-05' },
            reason: { type: 'string' },
            status: { type: 'string', enum: ['Pending', 'Approved', 'Rejected'] },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 100 },
                page: { type: 'number', example: 1 },
                pages: { type: 'number', example: 5 },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication & profile management' },
      { name: 'Users', description: 'User management' },
      { name: 'Services', description: 'Salon service catalog' },
      { name: 'Appointments', description: 'Booking & appointment management' },
      { name: 'Staff', description: 'Staff & shift management' },
      { name: 'Wages', description: 'Earnings & commission tracking' },
      { name: 'Inventory', description: 'Stock & supplier management' },
      { name: 'Products', description: 'Retail product store' },
      { name: 'Orders', description: 'Product order checkout' },
      { name: 'Analytics', description: 'Admin analytics & charts' },
      { name: 'Dashboard', description: 'Role-specific dashboard data' },
    ],
    paths: {
      // ─── Auth ───────────────────────────────────────────────
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Alex Mercer' },
                    email: { type: 'string', example: 'alex@example.com' },
                    password: { type: 'string', example: 'customer123' },
                    role: {
                      type: 'string',
                      enum: ['Customer', 'Barber', 'Receptionist', 'Admin'],
                      example: 'Customer',
                    },
                    phone: { type: 'string', example: '9876543215' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
            },
            400: { description: 'Validation error or user already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'alex@example.com' },
                    password: { type: 'string', example: 'customer123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
            },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Current user profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/profile': {
        put: {
          tags: ['Auth'],
          summary: 'Update profile',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    avatar: { type: 'string' },
                    bio: { type: 'string' },
                    address: {
                      type: 'object',
                      properties: {
                        street: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string' },
                        zip: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/auth/change-password': {
        put: {
          tags: ['Auth'],
          summary: 'Change password',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentPassword', 'newPassword'],
                  properties: {
                    currentPassword: { type: 'string' },
                    newPassword: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password updated' },
            401: { description: 'Current password incorrect' },
          },
        },
      },
      '/api/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: { email: { type: 'string', example: 'alex@example.com' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Reset token generated' },
            404: { description: 'User not found' },
          },
        },
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['resetToken', 'newPassword'],
                  properties: {
                    resetToken: { type: 'string' },
                    newPassword: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Password reset successful' },
            400: { description: 'Invalid or expired token' },
          },
        },
      },

      // ─── Users ──────────────────────────────────────────────
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Get all users',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['Customer', 'Barber', 'Receptionist', 'Admin'] } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: { description: 'List of users', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/api/users/barbers': {
        get: {
          tags: ['Users'],
          summary: 'Get all active barbers',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'specialization', in: 'query', schema: { type: 'string' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'List of barbers' },
          },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User details' },
            404: { description: 'User not found' },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Update user (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    phone: { type: 'string' },
                    isActive: { type: 'boolean' },
                    specializations: { type: 'array', items: { type: 'string' } },
                    experience: { type: 'number' },
                    workingHours: { type: 'object' },
                    workingDays: { type: 'array', items: { type: 'string' } },
                    commissionRate: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'User updated' },
            403: { description: 'Forbidden' },
          },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'User deleted' },
            403: { description: 'Forbidden' },
          },
        },
      },

      // ─── Services ───────────────────────────────────────────
      '/api/services': {
        get: {
          tags: ['Services'],
          summary: 'Get all services (with filters)',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'minDuration', in: 'query', schema: { type: 'number' } },
            { name: 'maxDuration', in: 'query', schema: { type: 'number' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: {
            200: {
              description: 'List of services',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Service' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Services'],
          summary: 'Create service (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'category', 'price', 'duration'],
                  properties: {
                    name: { type: 'string', example: 'Classic Haircut' },
                    description: { type: 'string' },
                    category: { type: 'string', example: 'Haircut' },
                    price: { type: 'number', example: 20 },
                    duration: { type: 'number', example: 30 },
                    image: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Service created' },
            403: { description: 'Forbidden' },
          },
        },
      },
      '/api/services/categories': {
        get: {
          tags: ['Services'],
          summary: 'Get service categories',
          responses: {
            200: { description: 'List of categories' },
          },
        },
      },
      '/api/services/{id}': {
        get: {
          tags: ['Services'],
          summary: 'Get service by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Service details', content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } } },
            404: { description: 'Service not found' },
          },
        },
        put: {
          tags: ['Services'],
          summary: 'Update service (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Service' },
              },
            },
          },
          responses: {
            200: { description: 'Service updated' },
            403: { description: 'Forbidden' },
          },
        },
        delete: {
          tags: ['Services'],
          summary: 'Delete service (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Service deleted' },
            403: { description: 'Forbidden' },
          },
        },
      },

      // ─── Appointments ───────────────────────────────────────
      '/api/appointments': {
        get: {
          tags: ['Appointments'],
          summary: 'Get all appointments (Admin/Receptionist)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'] } },
            { name: 'date', in: 'query', schema: { type: 'string', example: '2026-07-15' } },
            { name: 'barber', in: 'query', schema: { type: 'string' } },
            { name: 'customer', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Paginated appointments' },
          },
        },
        post: {
          tags: ['Appointments'],
          summary: 'Create appointment (booking wizard)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['service', 'barber', 'date', 'timeSlot'],
                  properties: {
                    service: { type: 'string', example: 'srv_102' },
                    barber: { type: 'string', example: 'emp_441' },
                    date: { type: 'string', example: '2026-07-15' },
                    timeSlot: { type: 'string', example: '14:30' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Appointment created' },
            400: { description: 'Slot already booked or barber on leave' },
          },
        },
      },
      '/api/appointments/my': {
        get: {
          tags: ['Appointments'],
          summary: 'Get my appointments',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'upcoming', in: 'query', schema: { type: 'boolean' }, description: 'If true, returns upcoming non-cancelled appointments' },
          ],
          responses: {
            200: { description: 'Customer appointments' },
          },
        },
      },
      '/api/appointments/barber': {
        get: {
          tags: ['Appointments'],
          summary: "Get barber's assigned appointments",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'date', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Barber appointments' },
          },
        },
      },
      '/api/appointments/available-slots': {
        get: {
          tags: ['Appointments'],
          summary: 'Get available time slots for a barber on a date',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'barberId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-07-15' } },
          ],
          responses: {
            200: {
              description: 'Available slots',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            time: { type: 'string', example: '10:00' },
                            available: { type: 'boolean', example: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/appointments/{id}': {
        get: {
          tags: ['Appointments'],
          summary: 'Get appointment by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Appointment details' },
            404: { description: 'Not found' },
          },
        },
      },
      '/api/appointments/{id}/status': {
        put: {
          tags: ['Appointments'],
          summary: 'Update appointment status',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
                      example: 'Confirmed',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Status updated' },
          },
        },
      },
      '/api/appointments/{id}/cancel': {
        put: {
          tags: ['Appointments'],
          summary: 'Cancel appointment',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { reason: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Appointment cancelled' },
          },
        },
      },
      '/api/appointments/{id}/reschedule': {
        put: {
          tags: ['Appointments'],
          summary: 'Reschedule appointment',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['date', 'timeSlot'],
                  properties: {
                    date: { type: 'string', example: '2026-07-20' },
                    timeSlot: { type: 'string', example: '11:00' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Appointment rescheduled' },
            400: { description: 'New slot already booked' },
          },
        },
      },
      '/api/appointments/{id}/assign': {
        put: {
          tags: ['Appointments'],
          summary: 'Assign / reassign barber (Admin/Receptionist)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['barberId'],
                  properties: { barberId: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Barber assigned' },
          },
        },
      },

      // ─── Staff ──────────────────────────────────────────────
      '/api/staff': {
        get: {
          tags: ['Staff'],
          summary: 'Get all staff',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'specialization', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Staff list' } },
        },
        post: {
          tags: ['Staff'],
          summary: 'Create staff member (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string' },
                    role: { type: 'string', enum: ['Barber', 'Receptionist'], example: 'Barber' },
                    phone: { type: 'string' },
                    specializations: { type: 'array', items: { type: 'string' } },
                    experience: { type: 'number' },
                    workingHours: {
                      type: 'object',
                      properties: {
                        start: { type: 'string', example: '09:00' },
                        end: { type: 'string', example: '18:00' },
                      },
                    },
                    workingDays: { type: 'array', items: { type: 'string' } },
                    commissionRate: { type: 'number', example: 30 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Staff created' } },
        },
      },
      '/api/staff/availability': {
        get: {
          tags: ['Staff'],
          summary: 'Get staff availability for a date',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'date', in: 'query', required: true, schema: { type: 'string', example: '2026-07-15' } },
          ],
          responses: { 200: { description: 'Availability list' } },
        },
      },
      '/api/staff/time-off': {
        get: {
          tags: ['Staff'],
          summary: 'Get all time-off requests (Admin/Receptionist)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Approved', 'Rejected'] } },
            { name: 'barber', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Time-off list' } },
        },
        post: {
          tags: ['Staff'],
          summary: 'Request time off (Barber)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['startDate', 'endDate'],
                  properties: {
                    startDate: { type: 'string', example: '2026-08-01' },
                    endDate: { type: 'string', example: '2026-08-05' },
                    reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Time-off requested' } },
        },
      },
      '/api/staff/my-time-off': {
        get: {
          tags: ['Staff'],
          summary: 'Get my time-off requests (Barber)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'My time-off list' } },
        },
      },
      '/api/staff/{id}': {
        get: {
          tags: ['Staff'],
          summary: 'Get staff member with stats',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Staff details' } },
        },
        put: {
          tags: ['Staff'],
          summary: 'Update staff member (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    specializations: { type: 'array', items: { type: 'string' } },
                    experience: { type: 'number' },
                    workingHours: { type: 'object' },
                    workingDays: { type: 'array', items: { type: 'string' } },
                    commissionRate: { type: 'number' },
                    isActive: { type: 'boolean' },
                    bio: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Staff updated' } },
        },
        delete: {
          tags: ['Staff'],
          summary: 'Delete staff member (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Staff deleted' } },
        },
      },
      '/api/staff/{id}/shift': {
        put: {
          tags: ['Staff'],
          summary: 'Update staff shift hours',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    workingHours: {
                      type: 'object',
                      properties: {
                        start: { type: 'string', example: '09:00' },
                        end: { type: 'string', example: '18:00' },
                      },
                    },
                    workingDays: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Shift updated' } },
        },
      },
      '/api/staff/time-off/{id}': {
        put: {
          tags: ['Staff'],
          summary: 'Approve or reject time-off request',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['Approved', 'Rejected', 'Pending'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Time-off status updated' } },
        },
      },

      // ─── Wages ──────────────────────────────────────────────
      '/api/wages': {
        get: {
          tags: ['Wages'],
          summary: 'Get all wage records (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'integer' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
            { name: 'barber', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['Pending', 'Paid', 'Hold'] } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Wage records' } },
        },
        post: {
          tags: ['Wages'],
          summary: 'Create wage record (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['barber', 'date', 'serviceAmount'],
                  properties: {
                    barber: { type: 'string' },
                    appointment: { type: 'string' },
                    service: { type: 'string' },
                    date: { type: 'string', example: '2026-07-12' },
                    serviceAmount: { type: 'number', example: 25 },
                    tips: { type: 'number', example: 5 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Wage record created' } },
        },
      },
      '/api/wages/my-earnings': {
        get: {
          tags: ['Wages'],
          summary: 'Get my earnings (Barber)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'integer' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Earnings with summary' } },
        },
      },
      '/api/wages/monthly-summary': {
        get: {
          tags: ['Wages'],
          summary: 'Get monthly earnings summary',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } },
          ],
          responses: { 200: { description: 'Monthly summary' } },
        },
      },
      '/api/wages/barber/{barberId}': {
        get: {
          tags: ['Wages'],
          summary: 'Get barber earnings (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'barberId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'month', in: 'query', schema: { type: 'integer' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Barber earnings' } },
        },
      },
      '/api/wages/{id}/status': {
        put: {
          tags: ['Wages'],
          summary: 'Update wage payment status (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['Pending', 'Paid', 'Hold'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' } },
        },
      },
      '/api/wages/commission/{barberId}': {
        put: {
          tags: ['Wages'],
          summary: 'Update barber commission rate (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'barberId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['commissionRate'],
                  properties: {
                    commissionRate: { type: 'number', example: 30, minimum: 0, maximum: 100 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Commission rate updated' } },
        },
      },

      // ─── Inventory ──────────────────────────────────────────
      '/api/inventory': {
        get: {
          tags: ['Inventory'],
          summary: 'Get all inventory items (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'isLowStock', in: 'query', schema: { type: 'boolean' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Inventory list' } },
        },
        post: {
          tags: ['Inventory'],
          summary: 'Create inventory item (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['itemName', 'category', 'currentStock', 'costPerUnit'],
                  properties: {
                    itemName: { type: 'string', example: 'Professional Shampoo 1L' },
                    category: { type: 'string', example: 'Shampoo' },
                    currentStock: { type: 'number', example: 25 },
                    minimumStock: { type: 'number', example: 10 },
                    unit: { type: 'string', example: 'bottles' },
                    costPerUnit: { type: 'number', example: 8.5 },
                    supplier: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        contact: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Item created' } },
        },
      },
      '/api/inventory/low-stock': {
        get: {
          tags: ['Inventory'],
          summary: 'Get low-stock alerts (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Low stock items' } },
        },
      },
      '/api/inventory/categories': {
        get: {
          tags: ['Inventory'],
          summary: 'Get inventory categories (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Categories' } },
        },
      },
      '/api/inventory/{id}': {
        get: {
          tags: ['Inventory'],
          summary: 'Get inventory item by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Item details' } },
        },
        put: {
          tags: ['Inventory'],
          summary: 'Update inventory item (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Inventory' },
              },
            },
          },
          responses: { 200: { description: 'Item updated' } },
        },
        delete: {
          tags: ['Inventory'],
          summary: 'Delete inventory item (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Item deleted' } },
        },
      },
      '/api/inventory/{id}/restock': {
        put: {
          tags: ['Inventory'],
          summary: 'Restock inventory item (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['quantity'],
                  properties: {
                    quantity: { type: 'number', example: 20 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Item restocked' } },
        },
      },

      // ─── Products ───────────────────────────────────────────
      '/api/products': {
        get: {
          tags: ['Products'],
          summary: 'Get all products (with filters)',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'brand', in: 'query', schema: { type: 'string' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'name', 'rating'] } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Product list' } },
        },
        post: {
          tags: ['Products'],
          summary: 'Create product (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'category', 'price'],
                  properties: {
                    name: { type: 'string', example: 'Premium Hair Wax' },
                    description: { type: 'string' },
                    category: { type: 'string', example: 'Styling' },
                    price: { type: 'number', example: 18.5 },
                    brand: { type: 'string' },
                    stockQuantity: { type: 'number' },
                    image: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Product created' } },
        },
      },
      '/api/products/categories': {
        get: {
          tags: ['Products'],
          summary: 'Get product categories',
          responses: { 200: { description: 'Categories' } },
        },
      },
      '/api/products/search': {
        get: {
          tags: ['Products'],
          summary: 'Search products',
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string', example: 'wax' } },
          ],
          responses: { 200: { description: 'Search results' } },
        },
      },
      '/api/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Product details' } },
        },
        put: {
          tags: ['Products'],
          summary: 'Update product (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          responses: { 200: { description: 'Product updated' } },
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete product (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Product deleted' } },
        },
      },

      // ─── Orders ─────────────────────────────────────────────
      '/api/orders': {
        get: {
          tags: ['Orders'],
          summary: 'Get all orders (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'paymentStatus', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Orders list' } },
        },
        post: {
          tags: ['Orders'],
          summary: 'Create order (checkout)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items'],
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['product', 'quantity'],
                        properties: {
                          product: { type: 'string' },
                          quantity: { type: 'integer', example: 2 },
                        },
                      },
                    },
                    shippingAddress: {
                      type: 'object',
                      properties: {
                        street: { type: 'string' },
                        city: { type: 'string' },
                        state: { type: 'string' },
                        zip: { type: 'string' },
                      },
                    },
                    paymentMethod: {
                      type: 'string',
                      enum: ['Cash', 'Card', 'UPI', 'Online'],
                      example: 'Card',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Order created' },
            400: { description: 'Insufficient stock' },
          },
        },
      },
      '/api/orders/my': {
        get: {
          tags: ['Orders'],
          summary: 'Get my orders',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'My orders' } },
        },
      },
      '/api/orders/{id}': {
        get: {
          tags: ['Orders'],
          summary: 'Get order by ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Order details' } },
        },
      },
      '/api/orders/{id}/status': {
        put: {
          tags: ['Orders'],
          summary: 'Update order status (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
                    },
                    paymentStatus: {
                      type: 'string',
                      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Order status updated' } },
        },
      },
      '/api/orders/{id}/cancel': {
        put: {
          tags: ['Orders'],
          summary: 'Cancel order',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Order cancelled' },
            400: { description: 'Cannot cancel shipped/delivered order' },
          },
        },
      },

      // ─── Analytics ──────────────────────────────────────────
      '/api/analytics/overview': {
        get: {
          tags: ['Analytics'],
          summary: 'Get overview stats (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Overview statistics' } },
        },
      },
      '/api/analytics/revenue': {
        get: {
          tags: ['Analytics'],
          summary: 'Get revenue analytics (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'year', in: 'query', schema: { type: 'integer', example: 2026 } },
          ],
          responses: { 200: { description: 'Monthly revenue data for charts' } },
        },
      },
      '/api/analytics/user-growth': {
        get: {
          tags: ['Analytics'],
          summary: 'Get user growth analytics (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'User growth data' } },
        },
      },
      '/api/analytics/service-popularity': {
        get: {
          tags: ['Analytics'],
          summary: 'Get service popularity (Admin)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Service & category popularity' } },
        },
      },
      '/api/analytics/staff-performance': {
        get: {
          tags: ['Analytics'],
          summary: 'Get staff performance (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'month', in: 'query', schema: { type: 'integer' } },
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Staff performance metrics' } },
        },
      },
      '/api/analytics/monthly-appointments': {
        get: {
          tags: ['Analytics'],
          summary: 'Get monthly appointment trends (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Monthly appointment data' } },
        },
      },

      // ─── Dashboard ──────────────────────────────────────────
      '/api/dashboard/customer': {
        get: {
          tags: ['Dashboard'],
          summary: 'Customer dashboard data',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Upcoming appointments, history, favorites, spending',
            },
          },
        },
      },
      '/api/dashboard/barber': {
        get: {
          tags: ['Dashboard'],
          summary: 'Barber dashboard data',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Today's appointments, earnings, commission",
            },
          },
        },
      },
      '/api/dashboard/receptionist': {
        get: {
          tags: ['Dashboard'],
          summary: 'Receptionist dashboard data',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Today's schedule, pending bookings, available barbers",
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
