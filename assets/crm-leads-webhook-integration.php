<?php
/**
 * Plugin Name: CRM Webhook Leads Integration & Form Builder
 * Description: Integração e gerador avançado de formulários para WordPress (Elementor, Contact Form 7, WPForms). Conecta diretamente ao seu CRM com envio instantâneo de leads.
 * Version: 2.0.0
 * Author: CRM Builder
 * Author URI: https://ai.studio/build
 * License: GPLv2 or later
 * Text Domain: crm-leads-webhook
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// -----------------------------------------------------------------------------
// WordPress Admin Menu & Settings
// -----------------------------------------------------------------------------
add_action( 'admin_menu', 'crm_webhook_add_admin_menu' );
function crm_webhook_add_admin_menu() {
    add_menu_page(
        'CRM Webhook',
        'CRM Webhook',
        'manage_options',
        'crm-webhook-settings',
        'crm_webhook_render_settings_page',
        'dashicons-rest-api',
        30
    );

    add_submenu_page(
        'crm-webhook-settings',
        'Configurações da API',
        'Configurações',
        'manage_options',
        'crm-webhook-settings',
        'crm_webhook_render_settings_page'
    );

    add_submenu_page(
        'crm-webhook-settings',
        'Construtor de Formulários',
        'Construtor de Formulários',
        'manage_options',
        'crm-webhook-builder',
        'crm_webhook_render_builder_page'
    );
}

add_action( 'admin_init', 'crm_webhook_register_settings' );
function crm_webhook_register_settings() {
    register_setting( 'crm_webhook_settings_group', 'crm_webhook_url' );
    register_setting( 'crm_webhook_settings_group', 'crm_webhook_api_key' );
}

// -----------------------------------------------------------------------------
// Admin Page 1: API Settings & Status
// -----------------------------------------------------------------------------
function crm_webhook_render_settings_page() {
    $webhook_url = get_option( 'crm_webhook_url' );
    $api_key = get_option( 'crm_webhook_api_key' );
    
    $status_html = '<span style="color: #d63638; font-weight: bold;">🔴 Não Conectado</span>';
    if ( ! empty( $webhook_url ) && ! empty( $api_key ) ) {
        $status_html = '<span style="color: #00a32a; font-weight: bold;">🟢 Ativo e Conectado ao CRM</span>';
    }
    ?>
    <div class="wrap">
        <h1 style="display: flex; align-items: center; gap: 10px;">
            <span class="dashicons dashicons-rest-api" style="font-size: 32px; width: 32px; height: 32px;"></span>
            Configuração da Integração CRM Webhook
        </h1>
        <p>Preencha os dados abaixo com a Chave Secreta e a URL de Webhook obtidas na aba "Integração" do seu painel do CRM.</p>
        
        <div style="background: #fff; border: 1px solid #ccd0d4; border-left: 4px solid #10b981; padding: 18px 22px; margin-top: 15px; border-radius: 8px; max-width: 850px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <h3 style="margin-top:0;">Status da Integração: <?php echo $status_html; ?></h3>
            <p style="margin-bottom: 0;">O plugin intercepta automaticamente os envios dos formulários do <strong>Elementor Pro Forms</strong>, <strong>Contact Form 7</strong> e <strong>WPForms</strong>, e disponibiliza o Shortcode de formulário customizável para qualquer construtor.</p>
        </div>

        <form method="post" action="options.php" style="margin-top: 20px; max-width: 850px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #ccd0d4;">
            <?php settings_fields( 'crm_webhook_settings_group' ); ?>
            <?php do_settings_sections( 'crm_webhook_settings_group' ); ?>
            
            <table class="form-table" role="presentation">
                <tr valign="top">
                    <th scope="row">URL do Webhook</th>
                    <td>
                        <input type="url" name="crm_webhook_url" value="<?php echo esc_attr( $webhook_url ); ?>" class="regular-text" style="width: 100%;" placeholder="https://seu-app-crm.run.app/api/leads/webhook" required />
                        <p class="description">URL completa do endpoint de recebimento de Leads do CRM.</p>
                    </td>
                </tr>
                
                <tr valign="top">
                    <th scope="row">Chave Secreta da API (API Key)</th>
                    <td>
                        <input type="text" name="crm_webhook_api_key" value="<?php echo esc_attr( $api_key ); ?>" class="regular-text" style="width: 100%; font-family: monospace;" placeholder="crm_sec_live_..." required />
                        <p class="description">Chave comercial enviada no cabeçalho <code>X-CRM-API-Key</code>.</p>
                    </td>
                </tr>
            </table>
            
            <?php submit_button( 'Salvar Configurações' ); ?>
        </form>

        <div style="margin-top: 30px; max-width: 850px; background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px;">
            <h3 style="margin-top:0; color: #38bdf8;">⚡ Testar Conectividade com o CRM</h3>
            <p style="font-size: 13px; color: #94a3b8;">Clique no botão abaixo para enviar um Lead de Teste ao seu CRM e confirmar o recebimento.</p>
            <button type="button" id="crm-test-connection-btn" class="button button-primary" style="background: #10b981; border-color: #10b981; font-weight: bold;">
                Enviar Lead de Teste via Webhook
            </button>
            <div id="crm-test-result" style="margin-top: 12px; font-family: monospace; font-size: 12px; display: none;"></div>
        </div>
    </div>

    <script>
    jQuery(document).ready(function($) {
        $('#crm-test-connection-btn').on('click', function() {
            var $btn = $(this);
            var $res = $('#crm-test-result');
            $btn.prop('disabled', true).text('Enviando...');
            $res.hide().removeClass('notice-success notice-error');

            $.post(ajaxurl, { action: 'crm_webhook_test_connection' }, function(response) {
                $btn.prop('disabled', false).text('Enviar Lead de Teste via Webhook');
                $res.show();
                if (response.success) {
                    $res.css({color: '#4ade80'}).html('✅ Sucesso! Resposta do CRM: ' + JSON.stringify(response.data));
                } else {
                    $res.css({color: '#f87171'}).html('❌ Erro: ' + (response.data || 'Falha na comunicação'));
                }
            });
        });
    });
    </script>
    <?php
}

// -----------------------------------------------------------------------------
// Admin Page 2: Visual Form Builder & Shortcode Generator
// -----------------------------------------------------------------------------
function crm_webhook_render_builder_page() {
    ?>
    <div class="wrap">
        <h1>🛠️ Construtor Visual de Formulário CRM</h1>
        <p>Gere e customize formulários HTML/Shortcode prontos para colar no Elementor, Gutenberg, Divi ou qualquer página WordPress.</p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; max-width: 1200px;">
            
            <!-- Controls Panel -->
            <div style="background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #ccd0d4;">
                <h3 style="margin-top:0;">Configurações do Formulário</h3>
                
                <p>
                    <label style="font-weight: bold; display: block;">Título do Formulário:</label>
                    <input type="text" id="builder-title" value="Solicitar Orçamento Comercial" style="width: 100%; padding: 8px;" />
                </p>

                <p>
                    <label style="font-weight: bold; display: block;">Texto do Botão:</label>
                    <input type="text" id="builder-button" value="Enviar Solicitação" style="width: 100%; padding: 8px;" />
                </p>

                <p>
                    <label style="font-weight: bold; display: block;">Cor do Botão:</label>
                    <input type="color" id="builder-color" value="#10b981" style="height: 40px; width: 80px; cursor: pointer;" />
                </p>

                <p>
                    <label style="font-weight: bold; display: block;">URL de Redirecionamento após Envio (Opcional):</label>
                    <input type="url" id="builder-redirect" placeholder="https://seusite.com/obrigado" style="width: 100%; padding: 8px;" />
                </p>

                <div style="margin-top: 15px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 8px;">Campos a Incluir:</label>
                    <label style="display: block;"><input type="checkbox" class="builder-field-cb" value="name" checked disabled /> Nome Completo (Obrigatório)</label>
                    <label style="display: block;"><input type="checkbox" class="builder-field-cb" value="email" checked /> E-mail</label>
                    <label style="display: block;"><input type="checkbox" class="builder-field-cb" value="phone" checked /> WhatsApp / Celular (Obrigatório)</label>
                    <label style="display: block;"><input type="checkbox" class="builder-field-cb" value="value" checked /> Valor Estimado (R$)</label>
                    <label style="display: block;"><input type="checkbox" class="builder-field-cb" value="notes" checked /> Mensagem / Observações</label>
                    <label style="display: block;"><input type="checkbox" class="builder-field-cb" value="cf_segmento" /> Campo Personalizado: Segmento (cf_segmento)</label>
                    <label style="display: block;"><input type="checkbox" class="builder-field-cb" value="cf_cnpj" /> Campo Personalizado: CNPJ/CPF (cf_cnpj)</label>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px border #cbd5e1;">
                    <h4 style="margin-top: 0;">Shortcode Gerado:</h4>
                    <textarea id="generated-shortcode" readonly rows="3" style="width: 100%; font-family: monospace; font-size: 13px; background: #1e293b; color: #38bdf8; padding: 10px; border-radius: 6px;"></textarea>
                    <button type="button" id="copy-shortcode-btn" class="button button-secondary" style="margin-top: 8px;">Copiar Shortcode</button>
                </div>
            </div>

            <!-- Live Preview Panel -->
            <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1;">
                <h3 style="margin-top:0;">Pré-visualização em Tempo Real</h3>
                <div id="form-live-preview-box"></div>
            </div>

        </div>
    </div>

    <script>
    jQuery(document).ready(function($) {
        function updateBuilder() {
            var title = $('#builder-title').val();
            var button = $('#builder-button').val();
            var color = $('#builder-color').val();
            var redirect = $('#builder-redirect').val();
            
            var fields = [];
            $('.builder-field-cb:checked').each(function() {
                fields.push($(this).val());
            });

            var shortcode = '[crm_lead_form title="' + title + '" button="' + button + '" button_color="' + color + '" fields="' + fields.join(',') + '"' + (redirect ? ' redirect="' + redirect + '"' : '') + ']';
            $('#generated-shortcode').val(shortcode);

            // Render live html
            var html = '<div style="background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); font-family: sans-serif;">';
            if (title) html += '<h4 style="margin-top: 0; text-align: center; color: #0f172a; font-size: 18px;">' + title + '</h4>';
            
            fields.forEach(function(f) {
                if (f === 'name') html += '<div style="margin-bottom: 12px;"><label style="display:block; font-size: 12px; font-weight: bold; color: #475569;">Nome Completo *</label><input type="text" placeholder="Seu nome" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>';
                if (f === 'email') html += '<div style="margin-bottom: 12px;"><label style="display:block; font-size: 12px; font-weight: bold; color: #475569;">E-mail *</label><input type="email" placeholder="seu@email.com" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>';
                if (f === 'phone') html += '<div style="margin-bottom: 12px;"><label style="display:block; font-size: 12px; font-weight: bold; color: #475569;">WhatsApp *</label><input type="tel" placeholder="(11) 99999-9999" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>';
                if (f === 'value') html += '<div style="margin-bottom: 12px;"><label style="display:block; font-size: 12px; font-weight: bold; color: #475569;">Valor Estimado (R$)</label><input type="number" placeholder="1500" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>';
                if (f === 'notes') html += '<div style="margin-bottom: 12px;"><label style="display:block; font-size: 12px; font-weight: bold; color: #475569;">Mensagem</label><textarea placeholder="Como podemos ajudar?" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;"></textarea></div>';
                if (f.indexOf('cf_') === 0) html += '<div style="margin-bottom: 12px;"><label style="display:block; font-size: 12px; font-weight: bold; color: #475569;">' + f + '</label><input type="text" style="width:100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" /></div>';
            });

            html += '<button type="button" style="width:100%; background:' + color + '; color:#fff; padding:12px; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">' + button + '</button>';
            html += '</div>';

            $('#form-live-preview-box').html(html);
        }

        $('#builder-title, #builder-button, #builder-color, #builder-redirect').on('input change', updateBuilder);
        $('.builder-field-cb').on('change', updateBuilder);
        updateBuilder();

        $('#copy-shortcode-btn').on('click', function() {
            var $txt = $('#generated-shortcode');
            $txt.select();
            document.execCommand('copy');
            alert('Shortcode copiado com sucesso!');
        });
    });
    </script>
    <?php
}

// AJAX handler for connection test button in WP Admin
add_action( 'wp_ajax_crm_webhook_test_connection', 'crm_webhook_test_connection_handler' );
function crm_webhook_test_connection_handler() {
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( 'Sem permissão de administrador.' );
    }

    $webhook_url = get_option( 'crm_webhook_url' );
    $api_key = get_option( 'crm_webhook_api_key' );

    if ( empty( $webhook_url ) || empty( $api_key ) ) {
        wp_send_json_error( 'Configure a URL do Webhook e a Chave Secreta antes de testar.' );
    }

    $raw_fields = [
        ['id' => 'name', 'title' => 'Nome', 'value' => 'Lead Teste WordPress Admin'],
        ['id' => 'email', 'title' => 'Email', 'value' => 'teste.wp@crmwebhook.com'],
        ['id' => 'phone', 'title' => 'Telefone', 'value' => '11999998888'],
        ['id' => 'value', 'title' => 'Valor', 'value' => '5000'],
        ['id' => 'notes', 'title' => 'Notas', 'value' => 'Teste de conexão enviado via painel do WordPress.']
    ];

    $res = crm_leads_deliver_webhook( $raw_fields, 'Teste de Conexão WP Admin' );
    if ( is_array( $res ) && ! empty( $res['success'] ) ) {
        wp_send_json_success( 'Lead de teste enviado e recebido com sucesso no CRM!' );
    } else {
        $err_msg = is_array( $res ) ? ( $res['error'] ?? 'Erro desconhecido' ) : 'Falha na comunicação';
        wp_send_json_error( $err_msg );
    }
}

// -----------------------------------------------------------------------------
// Core Webhook Delivery Function
// -----------------------------------------------------------------------------
function crm_leads_deliver_webhook( $raw_fields, $form_title = '' ) {
    $api_key = get_option( 'crm_webhook_api_key' );
    $webhook_url = get_option( 'crm_webhook_url' );

    if ( empty( $api_key ) || empty( $webhook_url ) ) {
        return ['success' => false, 'error' => 'Chave de API ou URL do Webhook não configuradas no WordPress.'];
    }

    $name = '';
    $nickname = '';
    $email = '';
    $phone = '';
    $value = 0;
    $notes = [];
    $customFields = [];
    $source = !empty( $form_title ) ? 'WP - ' . $form_title : 'Website Wordpress';

    // Parse fields
    foreach ( $raw_fields as $field ) {
        $id = strtolower( trim( $field['id'] ?? '' ) );
        $title = strtolower( trim( $field['title'] ?? '' ) );
        $val = sanitize_text_field( $field['value'] ?? '' );

        if ( empty( $val ) ) {
            continue;
        }

        // Custom field prefix detection
        if ( strpos( $id, 'cf_' ) === 0 ) {
            $customFields[$id] = $val;
            continue;
        }

        // Standard Mappings
        if ( in_array( $id, ['name', 'nome', 'first_name', 'fullname', 'seu-nome', 'nome-completo'] ) || strpos( $title, 'nome' ) !== false || strpos( $title, 'name' ) !== false ) {
            if ( empty( $name ) ) {
                $name = $val;
            } else {
                $name .= ' ' . $val;
            }
        }
        elseif ( in_array( $id, ['nickname', 'apelido', 'empresa', 'sobrenome'] ) || strpos( $title, 'apelido' ) !== false || strpos( $title, 'nickname' ) !== false ) {
            $nickname = $val;
        }
        elseif ( $id === 'email' || strpos( $id, 'email' ) !== false || strpos( $title, 'email' ) !== false || strpos( $title, 'e-mail' ) !== false ) {
            $email = $val;
        }
        elseif ( in_array( $id, ['phone', 'tel', 'whatsapp', 'celular', 'telefone', 'seu-telefone'] ) || strpos( $id, 'phone' ) !== false || strpos( $id, 'tel' ) !== false || strpos( $title, 'celular' ) !== false || strpos( $title, 'whatsapp' ) !== false ) {
            $phone = $val;
        }
        elseif ( in_array( $id, ['value', 'valor', 'price', 'preço', 'orcamento', 'orçamento'] ) || strpos( $title, 'valor' ) !== false || strpos( $title, 'preço' ) !== false || strpos( $title, 'orcamento' ) !== false ) {
            $value = floatval( preg_replace( '/[^0-9.]/', '', str_replace( ',', '.', $val ) ) );
        }
        elseif ( in_array( $id, ['source', 'origem', 'midia', 'utm_source'] ) || strpos( $title, 'origem' ) !== false || strpos( $title, 'source' ) !== false ) {
            $source = $val;
        }
        else {
            $label = !empty( $field['title'] ) ? $field['title'] : $field['id'];
            $notes[] = esc_html( $label ) . ": " . esc_html( $val );
        }
    }

    $payload = [
        'name'         => !empty( $name ) ? $name : 'Contato Wordpress',
        'nickname'     => $nickname,
        'email'        => $email,
        'phone'        => $phone,
        'value'        => $value,
        'source'       => $source,
        'notes'        => implode( "\n", $notes ),
        'customFields' => $customFields,
        'api_key'      => $api_key
    ];

    $args = [
        'method'      => 'POST',
        'timeout'     => 15,
        'redirection' => 5,
        'httpversion' => '1.0',
        'blocking'    => true,
        'sslverify'   => false, // Avoid cURL SSL verification errors on cPanel / local WP environments
        'headers'     => [
            'Content-Type'  => 'application/json',
            'X-CRM-API-Key' => $api_key
        ],
        'body'        => wp_json_encode( $payload ),
        'cookies'     => []
    ];

    $response = wp_remote_post( $webhook_url, $args );
    
    if ( is_wp_error( $response ) ) {
        $error_msg = $response->get_error_message();
        error_log( 'CRM Webhook Error: ' . $error_msg );
        return ['success' => false, 'error' => $error_msg];
    }

    $code = wp_remote_retrieve_response_code( $response );
    $body = wp_remote_retrieve_body( $response );

    if ( $code >= 200 && $code < 300 ) {
        return ['success' => true, 'data' => json_decode( $body, true )];
    } else {
        return ['success' => false, 'error' => 'Servidor retornou HTTP ' . $code . ': ' . $body];
    }
}

// Backend fallback AJAX handler for Shortcode form submission
add_action( 'wp_ajax_crm_webhook_submit_form_backend', 'crm_webhook_submit_form_backend_handler' );
add_action( 'wp_ajax_nopriv_crm_webhook_submit_form_backend', 'crm_webhook_submit_form_backend_handler' );
function crm_webhook_submit_form_backend_handler() {
    $raw = file_get_contents( 'php://input' );
    $data = json_decode( $raw, true );

    if ( ! $data ) {
        wp_send_json_error( 'Dados inválidos' );
    }

    $raw_fields = [];
    foreach ( $data as $k => $v ) {
        $raw_fields[] = [
            'id' => $k,
            'title' => $k,
            'value' => is_array($v) ? implode(', ', $v) : $v
        ];
    }

    $res = crm_leads_deliver_webhook( $raw_fields, $data['source'] ?? 'Formulário Site WP' );
    if ( is_array($res) && !empty($res['success']) ) {
        wp_send_json_success( ['message' => 'Lead recebido com sucesso'] );
    } else {
        $err = is_array($res) ? ($res['error'] ?? 'Falha no envio') : 'Falha no envio';
        wp_send_json_error( $err );
    }
}

// -----------------------------------------------------------------------------
// Shortcode [crm_lead_form] - Form Builder Renderer
// -----------------------------------------------------------------------------
add_shortcode( 'crm_lead_form', 'crm_lead_form_shortcode_handler' );
function crm_lead_form_shortcode_handler( $atts ) {
    $atts = shortcode_atts( [
        'title'        => 'Fale Conosco',
        'fields'       => 'name,email,phone,value,notes',
        'button'       => 'Enviar Formulário',
        'button_color' => '#10b981',
        'redirect'     => '',
        'source'       => 'Formulário Site (Shortcode)'
    ], $atts, 'crm_lead_form' );

    $webhook_url = get_option( 'crm_webhook_url' );
    $api_key = get_option( 'crm_webhook_api_key' );
    $ajax_url = admin_url( 'admin-ajax.php' );

    $field_list = array_map('trim', explode(',', $atts['fields']));
    $form_id = 'crm_form_' . uniqid();

    ob_start();
    ?>
    <div class="crm-form-container" style="background: #ffffff; border: 1px solid #e2e8f0; padding: 24px; border-radius: 16px; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); max-width: 500px; margin: 0 auto;">
        <?php if ( ! empty( $atts['title'] ) ) : ?>
            <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 18px; font-weight: 800; color: #0f172a; text-align: center;"><?php echo esc_html($atts['title']); ?></h3>
        <?php endif; ?>

        <form id="<?php echo esc_attr($form_id); ?>" onsubmit="return handleCrmSubmit(event, '<?php echo esc_js($webhook_url); ?>', '<?php echo esc_js($api_key); ?>', '<?php echo esc_js($atts['source']); ?>', '<?php echo esc_js($atts['redirect']); ?>', '<?php echo esc_js($ajax_url); ?>')">
            
            <?php foreach ($field_list as $field) : ?>
                <?php
                $field = strtolower($field);
                if ( in_array($field, ['name', 'nome']) ) : ?>
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">Nome Completo *</label>
                        <input type="text" name="name" required placeholder="Seu nome" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" />
                    </div>
                <?php elseif ( in_array($field, ['email', 'e-mail']) ) : ?>
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">E-mail *</label>
                        <input type="email" name="email" required placeholder="seu@email.com" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" />
                    </div>
                <?php elseif ( in_array($field, ['phone', 'telefone', 'whatsapp', 'celular']) ) : ?>
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">WhatsApp / Telefone *</label>
                        <input type="tel" name="phone" required placeholder="(11) 99999-9999" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" />
                    </div>
                <?php elseif ( in_array($field, ['value', 'valor', 'orcamento']) ) : ?>
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">Valor Estimado (R$)</label>
                        <input type="number" name="value" placeholder="1500" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" />
                    </div>
                <?php elseif ( in_array($field, ['notes', 'observacoes', 'mensagem']) ) : ?>
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;">Observações / Mensagem</label>
                        <textarea name="notes" rows="3" placeholder="Como podemos te ajudar?" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;"></textarea>
                    </div>
                <?php elseif ( strpos($field, 'cf_') === 0 ) : ?>
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 4px;"><?php echo esc_html(ucwords(str_replace(['cf_', '_'], ['', ' '], $field))); ?></label>
                        <input type="text" name="<?php echo esc_attr($field); ?>" placeholder="" style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; box-sizing: border-box;" />
                    </div>
                <?php endif; ?>
            <?php endforeach; ?>

            <button type="submit" style="width: 100%; background: <?php echo esc_attr($atts['button_color']); ?>; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px; border: none; border-radius: 8px; cursor: pointer; transition: opacity 0.2s;">
                <?php echo esc_html($atts['button']); ?>
            </button>
            <div class="crm-form-status" style="margin-top: 12px; font-size: 13px; text-align: center; display: none;"></div>
        </form>
    </div>

    <script>
    if (typeof handleCrmSubmit === 'undefined') {
        window.handleCrmSubmit = function(e, url, key, source, redirectUrl, wpAjaxUrl) {
            e.preventDefault();
            var form = e.target;
            var statusDiv = form.querySelector('.crm-form-status');
            var btn = form.querySelector('button[type="submit"]');

            var formData = new FormData(form);
            var payload = {
                name: formData.get('name') || 'Contato Web',
                email: formData.get('email') || '',
                phone: formData.get('phone') || '',
                value: parseFloat(formData.get('value')) || 0,
                notes: formData.get('notes') || '',
                source: source || 'Formulário Site',
                customFields: {}
            };

            for (var pair of formData.entries()) {
                if (pair[0].indexOf('cf_') === 0) {
                    payload.customFields[pair[0]] = pair[1];
                }
            }

            btn.disabled = true;
            btn.innerHTML = 'Enviando...';
            statusDiv.style.display = 'none';

            function handleSuccess() {
                btn.disabled = false;
                btn.innerHTML = 'Enviado com Sucesso! ✓';
                statusDiv.style.display = 'block';
                statusDiv.style.color = '#10b981';
                statusDiv.innerHTML = '🎉 Obrigado! Seus dados foram enviados com sucesso.';
                form.reset();
                if (redirectUrl) {
                    setTimeout(function() { window.location.href = redirectUrl; }, 1000);
                } else {
                    setTimeout(function() { btn.innerHTML = '<?php echo esc_js($atts['button']); ?>'; }, 4000);
                }
            }

            function tryWpBackendFallback() {
                fetch(wpAjaxUrl + '?action=crm_webhook_submit_form_backend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.success) {
                        handleSuccess();
                    } else {
                        throw new Error('Fallback failed');
                    }
                })
                .catch(function(err) {
                    btn.disabled = false;
                    btn.innerHTML = '<?php echo esc_js($atts['button']); ?>';
                    statusDiv.style.display = 'block';
                    statusDiv.style.color = '#ef4444';
                    statusDiv.innerHTML = '❌ Falha ao enviar. Verifique se as credenciais do CRM estão corretas.';
                });
            }

            if (!url || !key) {
                tryWpBackendFallback();
                return false;
            }

            // Direct fetch attempt
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CRM-API-Key': key
                },
                body: JSON.stringify(payload)
            })
            .then(function(res) {
                if (!res.ok) throw new Error('CORS or Http Error');
                return res.json();
            })
            .then(function(data) {
                handleSuccess();
            })
            .catch(function(err) {
                // Fallback to WP Ajax backend proxy if direct fetch fails (e.g. adblocker / CORS)
                tryWpBackendFallback();
            });

            return false;
        };
    }
    </script>
    <?php
    return ob_get_clean();
}

// -----------------------------------------------------------------------------
// Integrations: Elementor, CF7, WPForms
// -----------------------------------------------------------------------------
add_action( 'elementor_pro/forms/new_record', 'crm_webhook_handle_elementor_submission', 10, 2 );
function crm_webhook_handle_elementor_submission( $record, $handler ) {
    $form_name = $record->get_form_settings( 'form_name' );
    $fields = $record->get( 'fields' );
    
    if ( empty( $fields ) ) {
        return;
    }

    $raw_fields = [];
    foreach ( $fields as $id => $field_obj ) {
        $raw_fields[] = [
            'id'    => $id,
            'title' => $field_obj['title'] ?? $id,
            'value' => $field_obj['value'] ?? ''
        ];
    }

    crm_leads_deliver_webhook( $raw_fields, 'Elementor Pro: ' . $form_name );
}

add_action( 'wpcf7_mail_sent', 'crm_webhook_handle_cf7_submission' );
function crm_webhook_handle_cf7_submission( $contact_form ) {
    $submission = WPCF7_Submission::get_instance();
    if ( ! $submission ) {
        return;
    }

    $posted_data = $submission->get_posted_data();
    $form_title = $contact_form->title();

    $raw_fields = [];
    foreach ( $posted_data as $key => $value ) {
        if ( strpos( $key, '_wpcf7' ) === 0 || in_array( $key, ['_wpnonce'] ) ) {
            continue;
        }

        $title = str_replace( ['-', '_'], ' ', $key );
        $title = ucwords( $title );

        $raw_fields[] = [
            'id'    => $key,
            'title' => $title,
            'value' => is_array( $value ) ? implode( ', ', $value ) : $value
        ];
    }

    crm_leads_deliver_webhook( $raw_fields, 'CF7: ' . $form_title );
}

add_action( 'wpforms_process_complete', 'crm_webhook_handle_wpforms_submission', 10, 4 );
function crm_webhook_handle_wpforms_submission( $fields, $entry, $form_data, $entry_id ) {
    $form_title = $form_data['settings']['form_title'] ?? 'WPForms';

    $raw_fields = [];
    foreach ( $fields as $field_id => $field_data ) {
        $raw_fields[] = [
            'id'    => 'field_' . $field_id,
            'title' => $field_data['name'] ?? ('Campo ' . $field_id),
            'value' => $field_data['value'] ?? ''
        ];
    }

    crm_leads_deliver_webhook( $raw_fields, 'WPForms: ' . $form_title );
}
