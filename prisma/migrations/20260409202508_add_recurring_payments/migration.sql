-- CreateTable
CREATE TABLE "RecurringPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecurringPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringPaymentOccurrence" (
    "id" TEXT NOT NULL,
    "recurringPaymentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "transactionId" TEXT,

    CONSTRAINT "RecurringPaymentOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringPayment_userId_idx" ON "RecurringPayment"("userId");

-- CreateIndex
CREATE INDEX "RecurringPayment_categoryId_idx" ON "RecurringPayment"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringPaymentOccurrence_transactionId_key" ON "RecurringPaymentOccurrence"("transactionId");

-- CreateIndex
CREATE INDEX "RecurringPaymentOccurrence_year_month_idx" ON "RecurringPaymentOccurrence"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringPaymentOccurrence_recurringPaymentId_year_month_key" ON "RecurringPaymentOccurrence"("recurringPaymentId", "year", "month");

-- AddForeignKey
ALTER TABLE "RecurringPayment" ADD CONSTRAINT "RecurringPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPayment" ADD CONSTRAINT "RecurringPayment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPaymentOccurrence" ADD CONSTRAINT "RecurringPaymentOccurrence_recurringPaymentId_fkey" FOREIGN KEY ("recurringPaymentId") REFERENCES "RecurringPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringPaymentOccurrence" ADD CONSTRAINT "RecurringPaymentOccurrence_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
