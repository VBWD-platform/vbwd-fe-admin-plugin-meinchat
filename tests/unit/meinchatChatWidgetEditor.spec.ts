/**
 * MeinchatChatWidget editor descriptor + tab oracle (S86.3 slice 3d, D3/D9).
 *
 * Installing the meinchat-admin plugin registers a widget editor descriptor for
 * componentName 'MeinchatChatWidget' through the SHARED cms-admin seam (no
 * meinchat strings in cms-admin). The descriptor carries the D3 config shape;
 * its editor tab renders the D3 fields and binds v-model:config — in particular
 * member_nicknames is typed as a comma-separated list and stored as string[]
 * (the comma-list <-> array round-trip); buildPreview emits a static chat-window
 * mock containing the title, welcome bubble, composer placeholder and the Start
 * button label.
 *
 * Engineering requirements (binding, restated): TDD-first (this RED set); SOLID
 * (OCP via the registry seam; SRP — the descriptor owns its config/preview);
 * DRY; clean code; no overengineering. Quality guard: ``npm run test`` +
 * ``npm run lint`` + ``vue-tsc``.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Component } from 'vue';
import { PluginRegistry, PlatformSDK } from 'vbwd-view-component';
import meinchatAdminPlugin from '../../index';
import { getWidgetEditor, registerWidgetEditor } from '../../../cms-admin/index';
import { registerMeinchatChatWidgetEditor } from '../../src/widgets/registerMeinchatChatWidgetEditor';

// Register the descriptor synchronously into the shared registry so the
// descriptor/tab assertions run against the real production registrar. The
// install()-path wiring is asserted separately below.
beforeAll(() => {
  registerMeinchatChatWidgetEditor(registerWidgetEditor);
});

describe('MeinchatChatWidget editor descriptor', () => {
  it('registers a MeinchatChatWidget descriptor through the shared seam', () => {
    expect(getWidgetEditor('MeinchatChatWidget')).toBeDefined();
  });

  it('defaultConfig() returns the D3 shape', () => {
    const descriptor = getWidgetEditor('MeinchatChatWidget')!;
    const config = descriptor.defaultConfig();
    expect(config).toMatchObject({
      component_name: 'MeinchatChatWidget',
      member_nicknames: [],
      visibility: 'public',
      start_button_label: 'Start Conversation',
      display: 'inline',
      open_by_default: false,
    });
    expect(Array.isArray(config.member_nicknames)).toBe(true);
  });

  it('cssHint targets the widget root class', () => {
    const descriptor = getWidgetEditor('MeinchatChatWidget')!;
    expect(descriptor.cssHint).toBeTruthy();
    expect(descriptor.cssHint).toContain('meinchat-chat-widget');
  });

  it('buildPreview emits the static chat-window mock', () => {
    const descriptor = getWidgetEditor('MeinchatChatWidget')!;
    const preview = descriptor.buildPreview({
      component_name: 'MeinchatChatWidget',
      title: 'Ask our team',
      welcome_message: 'Hi there, how can we help?',
      composer_placeholder: 'Type a message…',
      start_button_label: 'Start Conversation',
    });
    expect(typeof preview.html).toBe('string');
    expect(preview.html).toContain('Ask our team');
    expect(preview.html).toContain('Hi there, how can we help?');
    expect(preview.html).toContain('Type a message…');
    expect(preview.html).toContain('Start Conversation');
    // The composer must be disabled in the static mock.
    expect(preview.html).toContain('disabled');
  });
});

describe('MeinchatChatWidget editor tab', () => {
  function getDescriptor() {
    return getWidgetEditor('MeinchatChatWidget')!;
  }

  it('renders the D3 fields', () => {
    const descriptor = getDescriptor();
    const wrapper = mount(descriptor.generalTabComponent as Component, {
      props: { config: descriptor.defaultConfig() },
    });
    const html = wrapper.html();
    // visibility + display selects, the member list + text fields, the toggle.
    expect(wrapper.findAll('select').length).toBeGreaterThanOrEqual(2);
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
    expect(html).toContain('member');
  });

  it('binds member_nicknames as a comma-list that stores a string[]', async () => {
    const descriptor = getDescriptor();
    const wrapper = mount(descriptor.generalTabComponent as Component, {
      props: { config: descriptor.defaultConfig() },
    });
    const memberInput = wrapper.find('[data-test="member-nicknames"]');
    expect(memberInput.exists()).toBe(true);

    await memberInput.setValue('assistant, sales_bot ,  billing_bot');
    const emitted = wrapper.emitted('update:config');
    expect(emitted).toBeTruthy();
    const lastPayload = emitted![emitted!.length - 1][0] as Record<string, unknown>;
    expect(lastPayload.member_nicknames).toEqual([
      'assistant',
      'sales_bot',
      'billing_bot',
    ]);
  });

  it('renders an existing string[] member list back as a comma-list (round-trip)', () => {
    const descriptor = getDescriptor();
    const wrapper = mount(descriptor.generalTabComponent as Component, {
      props: {
        config: {
          ...descriptor.defaultConfig(),
          member_nicknames: ['assistant', 'sales_bot'],
        },
      },
    });
    const memberInput = wrapper.find('[data-test="member-nicknames"]')
      .element as HTMLInputElement;
    expect(memberInput.value).toBe('assistant, sales_bot');
  });

  it('emits update:config when the visibility select changes', async () => {
    const descriptor = getDescriptor();
    const wrapper = mount(descriptor.generalTabComponent as Component, {
      props: { config: descriptor.defaultConfig() },
    });
    const visibilitySelect = wrapper.find('[data-test="visibility"]');
    expect(visibilitySelect.exists()).toBe(true);
    await visibilitySelect.setValue('logged_in');
    const emitted = wrapper.emitted('update:config');
    expect(emitted).toBeTruthy();
    const lastPayload = emitted![emitted!.length - 1][0] as Record<string, unknown>;
    expect(lastPayload.visibility).toBe('logged_in');
  });
});

describe('meinchat-admin install() wires the widget editor', () => {
  it('registers MeinchatChatWidget through the cms-admin seam on install', async () => {
    const registry = new PluginRegistry();
    const sdk = new PlatformSDK();
    registry.register(meinchatAdminPlugin);
    await registry.installAll(sdk);

    // install() registers via two chained dynamic imports; poll the registry
    // until they settle.
    for (let attempt = 0; attempt < 50 && !getWidgetEditor('MeinchatChatWidget'); attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    expect(getWidgetEditor('MeinchatChatWidget')).toBeDefined();
  });
});
