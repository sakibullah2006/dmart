"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { BackgroundPattern } from "@/components/BackgroundPattern";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.firstName, data.lastName, data.email, data.password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setFormError("root", { message: errorMessage });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative flex-1 flex items-center justify-center py-12 px-4 bg-background overflow-hidden">
        <BackgroundPattern variant="gradient" intensity="subtle" />
        <motion.div
          className="relative w-full max-w-md z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <Card className="w-full backdrop-blur-sm bg-card/80 border-border/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
                <CardDescription className="text-center">
                  Enter your information to get started
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {errors.root && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
                    >
                      {errors.root.message}
                    </motion.div>
                  )}
                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        {...register("firstName")}
                        disabled={loading}
                        className={errors.firstName ? "border-destructive" : ""}
                      />
                      <FormError message={errors.firstName?.message} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        {...register("lastName")}
                        disabled={loading}
                        className={errors.lastName ? "border-destructive" : ""}
                      />
                      <FormError message={errors.lastName?.message} />
                    </div>
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      {...register("email")}
                      disabled={loading}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    <FormError message={errors.email?.message} />
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      {...register("password")}
                      disabled={loading}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    <FormError message={errors.password?.message} />
                    <p className="text-xs text-muted-foreground">
                      Minimum 8 characters. Mix of uppercase, lowercase, numbers, and symbols recommended.
                    </p>
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      {...register("confirmPassword")}
                      disabled={loading}
                      className={errors.confirmPassword ? "border-destructive" : ""}
                    />
                    <FormError message={errors.confirmPassword?.message} />
                  </motion.div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <motion.div variants={itemVariants} className="w-full">
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creating account..." : "Create account"}
                    </Button>
                  </motion.div>
                  <motion.p
                    variants={itemVariants}
                    className="text-sm text-center text-muted-foreground"
                  >
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                      Sign in
                    </Link>
                  </motion.p>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

