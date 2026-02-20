/**
 * Collapsible UI Component
 *
 * shadcn/ui 스타일의 collapsible 컴포넌트
 * Radix UI의 Collapsible primitive를 기반으로 구현
 */

'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
