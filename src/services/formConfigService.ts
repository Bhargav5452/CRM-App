import { supabase } from './supabase';
import { FormConfig, DEFAULT_FORM_CONFIG } from '../types/formConfig';

const LOCAL_STORAGE_FORM_CONFIG_KEY = 'offline_crm_form_config_v1';
export const ADMIN_USER_ID =
  import.meta.env.VITE_ADMIN_USER_ID || '00000000-0000-0000-0000-000000000000';

class FormConfigService {
  /**
   * Retrieves the currently active published configuration with explicit column selection.
   * Offline-first: returns cached version instantly if offline or upon fetch error.
   */
  public async getPublishedConfig(): Promise<FormConfig> {
    try {
      const { data, error } = await supabase
        .from('form_configs')
        .select(
          'id, version, title, subtitle, submit_button_text, success_message, fields, appearance, published_at'
        )
        .eq('status', 'published')
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        const config: FormConfig = {
          id: data.id,
          version: data.version,
          status: 'published',
          is_active: true,
          title: data.title || DEFAULT_FORM_CONFIG.title,
          subtitle: data.subtitle || DEFAULT_FORM_CONFIG.subtitle,
          submit_button_text:
            data.submit_button_text || DEFAULT_FORM_CONFIG.submit_button_text,
          success_message:
            data.success_message || DEFAULT_FORM_CONFIG.success_message,
          fields: Array.isArray(data.fields)
            ? data.fields
            : DEFAULT_FORM_CONFIG.fields,
          appearance:
            typeof data.appearance === 'object' && data.appearance !== null
              ? data.appearance
              : DEFAULT_FORM_CONFIG.appearance,
          published_at: data.published_at,
        };

        this.cacheConfig(config);
        return config;
      }
    } catch (err) {
      console.warn('Network error loading form config, using cache:', err);
    }

    return this.getCachedConfig();
  }

  /**
   * Retrieves the current working draft for the admin dashboard.
   * If no draft exists, clones one from the currently active published config.
   */
  public async getDraftConfig(): Promise<FormConfig> {
    const { data: draft, error } = await supabase
      .from('form_configs')
      .select(
        'id, version, status, is_active, title, subtitle, submit_button_text, success_message, fields, appearance, created_at, published_at'
      )
      .eq('status', 'draft')
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && draft) {
      return {
        id: draft.id,
        version: draft.version,
        status: 'draft',
        is_active: false,
        title: draft.title,
        subtitle: draft.subtitle,
        submit_button_text: draft.submit_button_text,
        success_message: draft.success_message,
        fields: draft.fields || [],
        appearance: draft.appearance || {},
        created_at: draft.created_at,
        published_at: draft.published_at,
      };
    }

    // No existing draft: Clone from currently active published config
    const active = await this.getPublishedConfig();
    const newVersion = (active.version || 1) + 1;

    const { data: newDraft, error: insertError } = await supabase
      .from('form_configs')
      .insert({
        version: newVersion,
        status: 'draft',
        is_active: false,
        title: active.title,
        subtitle: active.subtitle,
        submit_button_text: active.submit_button_text,
        success_message: active.success_message,
        fields: active.fields,
        appearance: active.appearance,
      })
      .select()
      .single();

    if (insertError || !newDraft) {
      throw new Error(
        insertError?.message || 'Failed to create new form draft.'
      );
    }

    return newDraft as FormConfig;
  }

  /**
   * Updates the working draft
   */
  public async saveDraft(
    configId: number,
    updates: Partial<FormConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('form_configs')
        .update({
          title: updates.title,
          subtitle: updates.subtitle,
          submit_button_text: updates.submit_button_text,
          success_message: updates.success_message,
          fields: updates.fields,
          appearance: updates.appearance,
        })
        .eq('id', configId)
        .eq('status', 'draft');

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to save draft.',
      };
    }
  }

  /**
   * Atomically publishes the draft via secure database stored procedure
   */
  public async publishConfig(
    configId: number
  ): Promise<{ success: boolean; publishedConfig?: FormConfig; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('publish_form_config', {
        p_config_id: configId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        this.cacheConfig(data as FormConfig);
      }

      return { success: true, publishedConfig: data as FormConfig };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to publish configuration.',
      };
    }
  }

  /**
   * Retrieves all published and archived versions for rollback history
   */
  public async getVersionHistory(): Promise<
    Array<{
      id: number;
      version: number;
      status: string;
      is_active: boolean;
      title: string;
      subtitle: string;
      published_at: string | null;
      created_at: string;
    }>
  > {
    const { data, error } = await supabase
      .from('form_configs')
      .select(
        'id, version, status, is_active, title, subtitle, published_at, created_at'
      )
      .order('version', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data;
  }

  /**
   * Restores an earlier version into the current working draft
   */
  public async restoreVersionToDraft(
    sourceVersionId: number,
    currentDraftId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: source, error: sourceError } = await supabase
        .from('form_configs')
        .select('title, subtitle, submit_button_text, success_message, fields, appearance')
        .eq('id', sourceVersionId)
        .single();

      if (sourceError || !source) {
        return {
          success: false,
          error: sourceError?.message || 'Source version not found.',
        };
      }

      return await this.saveDraft(currentDraftId, source);
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to restore version.',
      };
    }
  }

  public getCachedConfig(): FormConfig {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_FORM_CONFIG_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore JSON parse error
    }
    return DEFAULT_FORM_CONFIG;
  }

  private cacheConfig(config: FormConfig): void {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_FORM_CONFIG_KEY,
        JSON.stringify(config)
      );
    } catch {
      // ignore local storage quota error
    }
  }
}

export const formConfigService = new FormConfigService();
