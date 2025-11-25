/**
 * Composable для управления сценарием "Автопилот"
 * 
 * Автопилот автоматизирует процесс:
 * 1. Создание договора → предложение создать подписку
 * 2. Создание подписки → предложение создать счет
 * 3. Создание счета → предложение отправить его клиенту
 */

import { ref } from 'vue';
import type { Contract } from '@/types/contract';
import type { Subscription } from '@/types/billing';
import type { Invoice } from '@/types/billing';

export interface AutopilotDialogOptions {
  show: boolean;
  contractId?: number;
  contractNumber?: string;
  subscriptionId?: number;
  invoiceId?: number;
}

// Создаем синглтон - единое состояние для всех компонентов
// Диалоги автопилота
const showSubscriptionOffer = ref(false);
const showInvoiceOffer = ref(false);
const showSendInvoiceOffer = ref(false);

// Данные для диалогов
const currentContract = ref<Contract | null>(null);
const currentSubscription = ref<Subscription | null>(null);
const currentInvoice = ref<Invoice | null>(null);

export function useAutopilot() {
  /**
   * Шаг 1: После создания договора предлагаем создать подписку
   */
  const offerSubscriptionAfterContract = (contract: Contract) => {
    currentContract.value = contract;
    showSubscriptionOffer.value = true;
  };

  /**
   * Шаг 2: После создания подписки предлагаем создать счет
   */
  const offerInvoiceAfterSubscription = (subscription: Subscription) => {
    currentSubscription.value = subscription;
    showInvoiceOffer.value = true;
  };

  /**
   * Шаг 3: После создания счета предлагаем отправить его
   */
  const offerSendAfterInvoice = (invoice: Invoice) => {
    currentInvoice.value = invoice;
    showSendInvoiceOffer.value = true;
  };

  /**
   * Закрыть диалог предложения подписки
   */
  const closeSubscriptionOffer = () => {
    showSubscriptionOffer.value = false;
    currentContract.value = null;
  };

  /**
   * Закрыть диалог предложения счета
   */
  const closeInvoiceOffer = () => {
    showInvoiceOffer.value = false;
    currentSubscription.value = null;
  };

  /**
   * Закрыть диалог предложения отправки
   */
  const closeSendInvoiceOffer = () => {
    showSendInvoiceOffer.value = false;
    currentInvoice.value = null;
  };

  /**
   * Сбросить все состояния автопилота
   */
  const resetAutopilot = () => {
    closeSubscriptionOffer();
    closeInvoiceOffer();
    closeSendInvoiceOffer();
  };

  return {
    // Состояния диалогов
    showSubscriptionOffer,
    showInvoiceOffer,
    showSendInvoiceOffer,

    // Данные
    currentContract,
    currentSubscription,
    currentInvoice,

    // Методы для открытия диалогов
    offerSubscriptionAfterContract,
    offerInvoiceAfterSubscription,
    offerSendAfterInvoice,

    // Методы для закрытия диалогов
    closeSubscriptionOffer,
    closeInvoiceOffer,
    closeSendInvoiceOffer,

    // Утилиты
    resetAutopilot,
  };
}

