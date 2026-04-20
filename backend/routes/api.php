<?php

declare(strict_types=1);

use App\Controllers\AdminController;
use App\Controllers\AuthController;
use App\Controllers\BookingController;
use App\Controllers\CommentController;
use App\Controllers\ContactController;
use App\Controllers\HealthController;
use App\Controllers\InvoiceController;
use App\Controllers\NotificationController;
use App\Controllers\PostController;
use App\Controllers\ProfileController;
use App\Controllers\ProviderController;
use App\Controllers\RatingController;
use App\Controllers\TourController;

/** @var \App\Core\Router $router */

// System
$router->get('/health', [HealthController::class, 'index']);

// Auth
$router->post('/auth/register', [AuthController::class, 'register']);
$router->post('/auth/login', [AuthController::class, 'login']);
$router->post('/auth/refresh', [AuthController::class, 'refresh']);
$router->post('/auth/logout', [AuthController::class, 'logout'], ['auth']);
$router->get('/auth/me', [AuthController::class, 'me'], ['auth']);
$router->post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
$router->post('/auth/reset-password', [AuthController::class, 'resetPassword']);
$router->put('/auth/change-password', [AuthController::class, 'changePassword'], ['auth']);

// Public tours
$router->get('/tours', [TourController::class, 'index']);
$router->get('/tours/featured', [TourController::class, 'featured']);
$router->get('/tours/promotions', [TourController::class, 'promotions']);
$router->get('/promotions', [TourController::class, 'publicPromotions']);
$router->get('/tours/{id}', [TourController::class, 'detail']);
$router->get('/tours/{id}/comments', [TourController::class, 'comments']);
$router->get('/tours/{id}/ratings', [TourController::class, 'ratings']);

// Profile + wishlist
$router->get('/profile', [ProfileController::class, 'getProfile'], ['auth']);
$router->put('/profile', [ProfileController::class, 'updateProfile'], ['auth']);
$router->post('/profile/avatar', [ProfileController::class, 'uploadAvatar'], ['auth']);
$router->get('/wishlist', [ProfileController::class, 'wishlist'], ['auth']);
$router->post('/wishlist', [ProfileController::class, 'addWishlist'], ['auth']);
$router->delete('/wishlist/{tourId}', [ProfileController::class, 'removeWishlist'], ['auth']);

// Bookings
$router->post('/bookings', [BookingController::class, 'create'], ['auth']);
$router->get('/bookings/my', [BookingController::class, 'myBookings'], ['auth']);
$router->get('/bookings/{id}', [BookingController::class, 'detail'], ['auth']);
$router->put('/bookings/{id}/cancel', [BookingController::class, 'cancel'], ['auth']);
$router->post('/bookings/{id}/apply-promotion', [BookingController::class, 'applyPromotion'], ['auth']);
$router->post('/bookings/{id}/payment', [BookingController::class, 'payment'], ['auth']);

// Invoices
$router->get('/invoices/{id}', [InvoiceController::class, 'detail'], ['auth']);
$router->get('/invoices/{id}/pdf', [InvoiceController::class, 'downloadPdf'], ['auth']);

// Notifications
$router->get('/notifications', [NotificationController::class, 'index'], ['auth']);
$router->put('/notifications/read-all', [NotificationController::class, 'readAll'], ['auth']);
$router->put('/notifications/{id}/read', [NotificationController::class, 'read'], ['auth']);

// Comments / ratings
$router->post('/comments', [CommentController::class, 'create'], ['auth']);
$router->put('/comments/{id}', [CommentController::class, 'update'], ['auth']);
$router->delete('/comments/{id}', [CommentController::class, 'delete'], ['auth']);
$router->post('/ratings', [RatingController::class, 'create'], ['auth']);
$router->put('/ratings/{id}', [RatingController::class, 'update'], ['auth']);
$router->delete('/ratings/{id}', [RatingController::class, 'delete'], ['auth']);

// Posts
$router->get('/posts', [PostController::class, 'index']);
$router->get('/posts/{slug}', [PostController::class, 'detail']);

// Public comments feed
$router->get('/comments/public', [CommentController::class, 'publicFeed']);

// Contact
$router->post('/contact', [ContactController::class, 'create']);
$router->post('/newsletter/subscribe', [ContactController::class, 'subscribe']);

// Provider
$router->post('/provider/request', [ProviderController::class, 'requestProvider'], ['auth']);
$router->get('/provider/request', [ProviderController::class, 'latestRequest'], ['auth']);
$router->get('/provider/profile', [ProviderController::class, 'profile'], ['auth', 'role:provider,admin']);
$router->put('/provider/profile', [ProviderController::class, 'updateProfile'], ['auth', 'role:provider,admin']);
$router->get('/provider/dashboard', [ProviderController::class, 'dashboard'], ['auth', 'role:provider,admin']);
$router->get('/provider/tours', [ProviderController::class, 'tours'], ['auth', 'role:provider,admin']);
$router->post('/provider/tours', [ProviderController::class, 'createTour'], ['auth', 'role:provider,admin']);
$router->get('/provider/tours/{id}', [ProviderController::class, 'getTour'], ['auth', 'role:provider,admin']);
$router->put('/provider/tours/{id}', [ProviderController::class, 'updateTour'], ['auth', 'role:provider,admin']);
$router->delete('/provider/tours/{id}', [ProviderController::class, 'deleteTour'], ['auth', 'role:provider,admin']);
$router->post('/provider/tours/{id}/images', [ProviderController::class, 'uploadTourImage'], ['auth', 'role:provider,admin']);
$router->get('/provider/bookings', [ProviderController::class, 'bookings'], ['auth', 'role:provider,admin']);
$router->get('/provider/bookings/{id}', [ProviderController::class, 'bookingDetail'], ['auth', 'role:provider,admin']);
$router->put('/provider/bookings/{id}/confirm', [ProviderController::class, 'bookingConfirm'], ['auth', 'role:provider,admin']);
$router->put('/provider/bookings/{id}/cancel', [ProviderController::class, 'bookingCancel'], ['auth', 'role:provider,admin']);
$router->get('/provider/services', [ProviderController::class, 'services'], ['auth', 'role:provider,admin']);
$router->post('/provider/services', [ProviderController::class, 'createService'], ['auth', 'role:provider,admin']);
$router->put('/provider/services/{id}', [ProviderController::class, 'updateService'], ['auth', 'role:provider,admin']);
$router->delete('/provider/services/{id}', [ProviderController::class, 'deleteService'], ['auth', 'role:provider,admin']);
$router->get('/provider/promotions', [ProviderController::class, 'promotions'], ['auth', 'role:provider,admin']);
$router->post('/provider/promotions', [ProviderController::class, 'createPromotion'], ['auth', 'role:provider,admin']);
$router->post('/provider/promotions/upload-image', [ProviderController::class, 'uploadPromotionImage'], ['auth', 'role:provider,admin']);
$router->put('/provider/promotions/{id}', [ProviderController::class, 'updatePromotion'], ['auth', 'role:provider,admin']);
$router->delete('/provider/promotions/{id}', [ProviderController::class, 'deletePromotion'], ['auth', 'role:provider,admin']);
$router->get('/provider/feedback', [ProviderController::class, 'feedback'], ['auth', 'role:provider,admin']);
$router->put('/provider/feedback/{id}/hide', [ProviderController::class, 'hideFeedback'], ['auth', 'role:provider,admin']);
$router->put('/provider/feedback/{id}/reply', [ProviderController::class, 'replyFeedback'], ['auth', 'role:provider,admin']);

// Admin
$router->get('/admin/dashboard', [AdminController::class, 'dashboard'], ['auth', 'role:admin']);
$router->get('/admin/stats', [AdminController::class, 'stats'], ['auth', 'role:admin']);

$router->get('/admin/users', [AdminController::class, 'users'], ['auth', 'role:admin']);
$router->post('/admin/users', [AdminController::class, 'createUser'], ['auth', 'role:admin']);
$router->get('/admin/users/{id}', [AdminController::class, 'getUser'], ['auth', 'role:admin']);
$router->put('/admin/users/{id}', [AdminController::class, 'updateUser'], ['auth', 'role:admin']);
$router->delete('/admin/users/{id}', [AdminController::class, 'deleteUser'], ['auth', 'role:admin']);

$router->get('/admin/roles', [AdminController::class, 'roles'], ['auth', 'role:admin']);
$router->post('/admin/roles', [AdminController::class, 'createRole'], ['auth', 'role:admin']);
$router->put('/admin/roles/{id}', [AdminController::class, 'updateRole'], ['auth', 'role:admin']);
$router->delete('/admin/roles/{id}', [AdminController::class, 'deleteRole'], ['auth', 'role:admin']);

$router->get('/admin/tours', [AdminController::class, 'tours'], ['auth', 'role:admin']);
$router->post('/admin/tours', [AdminController::class, 'createTour'], ['auth', 'role:admin']);
$router->get('/admin/tours/{id}', [AdminController::class, 'getTour'], ['auth', 'role:admin']);
$router->put('/admin/tours/{id}', [AdminController::class, 'updateTour'], ['auth', 'role:admin']);
$router->delete('/admin/tours/{id}', [AdminController::class, 'deleteTour'], ['auth', 'role:admin']);

$router->get('/admin/categories', [AdminController::class, 'categories'], ['auth', 'role:admin']);
$router->post('/admin/categories', [AdminController::class, 'createCategory'], ['auth', 'role:admin']);
$router->put('/admin/categories/{id}', [AdminController::class, 'updateCategory'], ['auth', 'role:admin']);
$router->delete('/admin/categories/{id}', [AdminController::class, 'deleteCategory'], ['auth', 'role:admin']);

$router->get('/admin/bookings', [AdminController::class, 'bookings'], ['auth', 'role:admin']);
$router->get('/admin/bookings/{id}', [AdminController::class, 'bookingDetail'], ['auth', 'role:admin']);
$router->put('/admin/bookings/{id}', [AdminController::class, 'updateBooking'], ['auth', 'role:admin']);

$router->get('/admin/payments', [AdminController::class, 'payments'], ['auth', 'role:admin']);
$router->get('/admin/payments/{id}', [AdminController::class, 'paymentDetail'], ['auth', 'role:admin']);
$router->put('/admin/payments/{id}', [AdminController::class, 'updatePayment'], ['auth', 'role:admin']);

$router->get('/admin/invoices', [AdminController::class, 'invoices'], ['auth', 'role:admin']);
$router->get('/admin/invoices/{id}', [AdminController::class, 'invoiceDetail'], ['auth', 'role:admin']);

$router->get('/admin/posts', [AdminController::class, 'posts'], ['auth', 'role:admin']);
$router->post('/admin/posts', [AdminController::class, 'createPost'], ['auth', 'role:admin']);
$router->post('/admin/posts/upload-image', [AdminController::class, 'uploadPostImage'], ['auth', 'role:admin']);
$router->put('/admin/posts/{id}', [AdminController::class, 'updatePost'], ['auth', 'role:admin']);
$router->delete('/admin/posts/{id}', [AdminController::class, 'deletePost'], ['auth', 'role:admin']);

$router->get('/admin/promotions', [AdminController::class, 'promotions'], ['auth', 'role:admin']);
$router->post('/admin/promotions', [AdminController::class, 'createPromotion'], ['auth', 'role:admin']);
$router->post('/admin/promotions/upload-image', [AdminController::class, 'uploadPromotionImage'], ['auth', 'role:admin']);
$router->put('/admin/promotions/{id}', [AdminController::class, 'updatePromotion'], ['auth', 'role:admin']);
$router->delete('/admin/promotions/{id}', [AdminController::class, 'deletePromotion'], ['auth', 'role:admin']);

$router->get('/admin/providers', [AdminController::class, 'providers'], ['auth', 'role:admin']);
$router->get('/admin/providers/{id}', [AdminController::class, 'providerDetail'], ['auth', 'role:admin']);
$router->put('/admin/providers/{id}/approve', [AdminController::class, 'providerApprove'], ['auth', 'role:admin']);
$router->put('/admin/providers/{id}/reject', [AdminController::class, 'providerReject'], ['auth', 'role:admin']);
$router->get('/admin/provider-requests', [AdminController::class, 'providerRequests'], ['auth', 'role:admin']);
$router->put('/admin/provider-requests/{id}/approve', [AdminController::class, 'providerRequestApprove'], ['auth', 'role:admin']);
$router->put('/admin/provider-requests/{id}/reject', [AdminController::class, 'providerRequestReject'], ['auth', 'role:admin']);

$router->get('/admin/comments', [AdminController::class, 'comments'], ['auth', 'role:admin']);
$router->put('/admin/comments/{id}/hide', [AdminController::class, 'hideComment'], ['auth', 'role:admin']);
$router->delete('/admin/comments/{id}', [AdminController::class, 'deleteComment'], ['auth', 'role:admin']);



