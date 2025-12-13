import * as yup from 'yup';
const passwordSchema = yup
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .matches(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
    .matches(/[0-9]/, 'Şifre en az bir rakam içermelidir')
    .required('Şifre zorunludur');
export const loginSchema = yup.object({
    email: yup.string().email('Geçerli bir email adresi girin').required('Email zorunludur'),
    password: yup.string().required('Şifre zorunludur'),
    rememberMe: yup.boolean().optional(),
});
export const registerSchema = yup.object({
    fullName: yup.string().min(3, 'Ad soyad en az 3 karakter olmalı').required('Ad soyad zorunlu'),
    email: yup.string().email('Geçerli bir email adresi girin').required('Email zorunludur'),
    password: passwordSchema,
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
        .required('Şifre tekrar zorunlu'),
    role: yup.mixed().oneOf(['student', 'faculty']).required(),
    studentNumber: yup.string().when('role', {
        is: 'student',
        then: (schema) => schema.required('Öğrenci numarası zorunludur'),
        otherwise: (schema) => schema.optional(),
    }),
    department: yup.string().required('Bölüm seçimi zorunludur'),
    termsAccepted: yup
        .boolean()
        .oneOf([true], 'Şartları ve koşulları kabul etmelisiniz')
        .required(),
});
export const forgotPasswordSchema = yup.object({
    email: yup.string().email('Geçerli bir email adresi girin').required('Email zorunludur'),
});
export const resetPasswordSchema = yup.object({
    password: passwordSchema,
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Şifreler eşleşmiyor')
        .required('Şifre tekrar zorunlu'),
});
export const profileSchema = yup.object({
    fullName: yup.string().min(3, 'En az 3 karakter olmalı').required('Ad soyad zorunlu'),
    phone: yup.string().nullable(),
    department: yup.string().nullable(),
});
export const changePasswordSchema = yup.object({
    currentPassword: yup.string().required('Mevcut şifre zorunlu'),
    newPassword: passwordSchema.notOneOf([yup.ref('currentPassword')], 'Yeni şifre mevcut şifreyle aynı olamaz'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('newPassword')], 'Şifreler eşleşmiyor')
        .required('Şifre tekrar zorunlu'),
});
