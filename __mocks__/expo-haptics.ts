/**
 * expo-haptics icin manuel mock.
 *
 * Native titresim modulu Jest ortaminda yok. Bu mock yalnizca modulun
 * IMPORT EDILEBILMESI icin var; titresim secim mantigi haptics.test.ts'te
 * enjekte edilen sahte tetikleyiciyle test ediliyor.
 */

export enum ImpactFeedbackStyle {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Rigid = 'rigid',
  Soft = 'soft',
}

export enum NotificationFeedbackType {
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

export function impactAsync(_style?: ImpactFeedbackStyle): Promise<void> {
  return Promise.resolve();
}

export function notificationAsync(_type?: NotificationFeedbackType): Promise<void> {
  return Promise.resolve();
}

export function selectionAsync(): Promise<void> {
  return Promise.resolve();
}
