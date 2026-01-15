# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from pathlib import Path

def create_project_summary():
    """生成PSP项目总结PDF"""

    # 注册中文字体 - 使用Windows系统自带字体
    import os
    font_paths = {
        'msyh': r'C:\Windows\Fonts\msyh.ttc',  # 微软雅黑
        'simsun': r'C:\Windows\Fonts\simsun.ttc',  # 宋体
        'simhei': r'C:\Windows\Fonts\simhei.ttf',  # 黑体
    }

    # 尝试注册中文字体
    chinese_font = 'Helvetica'  # 默认
    for font_name, font_path in font_paths.items():
        if os.path.exists(font_path):
            try:
                pdfmetrics.registerFont(TTFont(font_name, font_path))
                chinese_font = font_name
                print(f"✓ 成功注册字体: {font_name}")
                break
            except Exception as e:
                print(f"× 字体注册失败 {font_name}: {e}")
                continue

    # 创建输出文件
    output_path = Path(__file__).parent / "PSP项目总结_v3.pdf"
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    # 创建样式
    styles = getSampleStyleSheet()

    # 自定义样式
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName=chinese_font
    )

    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=HexColor('#2563eb'),
        spaceAfter=12,
        spaceBefore=20,
        fontName=chinese_font
    )

    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=HexColor('#475569'),
        spaceAfter=10,
        spaceBefore=15,
        fontName=chinese_font
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        textColor=HexColor('#334155'),
        spaceAfter=8,
        leading=16,
        alignment=TA_JUSTIFY,
        fontName=chinese_font
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=normal_style,
        leftIndent=20,
        spaceAfter=6,
        fontName=chinese_font
    )

    # 内容容器
    story = []

    # 标题页
    story.append(Paragraph("PSP - Programmers Search Platform", title_style))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph("程序员工具搜索平台", ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=16,
        textColor=HexColor('#64748b'),
        alignment=TA_CENTER,
        spaceAfter=30,
        fontName=chinese_font
    )))
    story.append(Spacer(1, 2*cm))

    # 项目概述
    story.append(Paragraph("项目概述", heading1_style))
    story.append(Paragraph(
        "PSP是一个基于大语言模型(LLM)的智能工具搜索引擎，致力于让程序员找到工具不再困难。"
        "通过自然语言搜索，帮助程序员快速找到所需的开发工具、软件和技术资源。",
        normal_style
    ))

    story.append(Spacer(1, 0.5*cm))

    # 核心特性表格
    feature_data = [
        ['特性', '描述'],
        ['智能搜索', '支持中英文自然语言查询，如"替代Photoshop的软件"'],
        ['三级缓存', '客户端+服务器+API，响应速度<0.1秒'],
        ['双语支持', '完整的中英文国际化实现'],
        ['精美UI', '深色模式、响应式设计、流畅动画'],
        ['高性能', '代码优化73KB(gzip)，缓存命中率96%+']
    ]

    feature_table = Table(feature_data, colWidths=[5*cm, 10*cm], hAlign='LEFT')
    feature_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), chinese_font),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f8fafc')),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#f8fafc')]),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('FONTNAME', (0, 1), (-1, -1), chinese_font),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(feature_table)
    story.append(Spacer(1, 1*cm))

    # 主要功能模块
    story.append(Paragraph("主要功能模块", heading1_style))

    # 1. 智能搜索模块
    story.append(Paragraph("1. 智能搜索模块", heading2_style))
    search_features = [
        "<b>自然语言搜索</b>: 支持中文和英文自然语言查询，如\\\"替代Photoshop的软件\\\"、\\\"Mac上的视频剪辑\\\"",
        "<b>智能语义理解</b>: 使用LLM(DeepSeek + 火山方舟双API)理解用户搜索意图",
        "<b>结构化结果</b>: 返回包含安装指南、使用说明、常见问题等完整信息",
        "<b>相关推荐</b>: 智能推荐相关工具"
    ]
    for feature in search_features:
        story.append(Paragraph(f"• {feature}", bullet_style))

    # 2. 缓存系统模块
    story.append(Paragraph("2. 缓存系统模块", heading2_style))
    cache_features = [
        "<b>三级缓存架构</b>: 客户端缓存(<0.1秒) + 服务器缓存(~50-100ms) + LLM API(3-5秒)",
        "<b>缓存命中率优化</b>: 通过语义归一化提高缓存命中率至96%+",
        "<b>缓存版本管理</b>: 支持双语数据格式的新旧版本兼容",
        "<b>智能过期策略</b>: 服务器缓存30天过期，客户端缓存长期有效"
    ]
    for feature in cache_features:
        story.append(Paragraph(f"• {feature}", bullet_style))

    # 3. 国际化模块
    story.append(Paragraph("3. 国际化模块", heading2_style))
    i18n_features = [
        "<b>中英文双语支持</b>: 完整的国际化实现",
        "<b>语言切换</b>: 实时切换，自动保存用户偏好到localStorage",
        "<b>双语数据结构</b>: 同时存储中英文版本，根据用户偏好显示"
    ]
    for feature in i18n_features:
        story.append(Paragraph(f"• {feature}", bullet_style))

    # 4. UI组件模块
    story.append(Paragraph("4. UI组件模块", heading2_style))
    ui_features = [
        "<b>搜索框组件</b>: 支持实时建议、热门搜索、GitHub Trending",
        "<b>搜索结果展示</b>: 美观的卡片式布局，支持展开/收起详细信息",
        "<b>深色模式</b>: 完整的深色/浅色主题切换，自动保存用户偏好",
        "<b>响应式设计</b>: 完美适配桌面、平板、手机等各种屏幕尺寸"
    ]
    for feature in ui_features:
        story.append(Paragraph(f"• {feature}", bullet_style))

    # 5. 速率限制模块
    story.append(Paragraph("5. 速率限制模块", heading2_style))
    rate_features = [
        "<b>5秒冷却机制</b>: 防止用户连续点击消耗API配额",
        "<b>每日限额</b>: 每用户每天30次搜索限制，控制API调用成本",
        "<b>缓存例外</b>: 已缓存工具可无限次查询，不受限额限制"
    ]
    for feature in rate_features:
        story.append(Paragraph(f"• {feature}", bullet_style))

    story.append(Spacer(1, 0.8*cm))

    # 分页
    story.append(PageBreak())

    # 技术栈
    story.append(Paragraph("技术栈", heading1_style))

    tech_data = [
        ['类别', '技术'],
        ['前端框架', 'React 18 + TypeScript'],
        ['构建工具', 'Vite'],
        ['样式框架', 'TailwindCSS'],
        ['组件库', 'shadcn/ui + Radix UI'],
        ['图标库', 'Lucide React'],
        ['HTTP客户端', 'Axios'],
        ['后端平台', 'Cloudflare Pages Functions'],
        ['数据库/缓存', 'Cloudflare KV'],
        ['LLM服务', 'DeepSeek API + 火山方舟 API'],
        ['托管平台', 'Cloudflare Pages'],
        ['域名', 'douya.chat'],
        ['构建优化', '代码分割、gzip压缩至73KB']
    ]

    tech_table = Table(tech_data, colWidths=[5*cm, 10*cm], hAlign='LEFT')
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), HexColor('#8b5cf6')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), chinese_font),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#faf5ff')),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#e9d5ff')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#faf5ff')]),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('FONTNAME', (0, 1), (-1, -1), chinese_font),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 1*cm))

    # 目标用户
    story.append(Paragraph("目标用户", heading1_style))

    user_data = [
        ['用户群体', '使用场景'],
        ['软件开发者', '寻找开发工具、框架、库'],
        ['系统管理员', '查找监控、部署、管理工具'],
        ['运维工程师', '寻找自动化、容器化工具'],
        ['设计师', '查找设计、图像处理工具']
    ]

    user_table = Table(user_data, colWidths=[5*cm, 10*cm], hAlign='LEFT')
    user_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (1, 0), HexColor('#10b981')),
        ('TEXTCOLOR', (0, 0), (1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), chinese_font),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), HexColor('#ecfdf5')),
        ('GRID', (0, 0), (-1, -1), 1, HexColor('#a7f3d0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#ecfdf5')]),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('FONTNAME', (0, 1), (-1, -1), chinese_font),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(user_table)
    story.append(Spacer(1, 1*cm))

    # 项目特色
    story.append(Paragraph("项目特色与创新", heading1_style))

    innovations = [
        ("<b>智能搜索体验</b>",
         "无需记忆工具名称，直接描述需求；LLM理解自然语言查询意图；智能纠错和推荐"),

        ("<b>高性能架构</b>",
         "三级缓存系统减少96%+的API消耗；快速响应：缓存查询<0.1秒，API查询3-5秒；"
         "代码优化：225KB→73KB(gzip)"),

        ("<b>成本控制</b>",
         "客户端缓存优先，大部分查询不消耗API配额；速率限制机制防止恶意刷接口；"
         "双API备份提高可用性"),

        ("<b>开发者友好</b>",
         "完整的技术文档和部署指南；开源MIT许可证；一键部署到Cloudflare Pages；"
         "支持本地开发环境"),

        ("<b>用户体验</b>",
         "精美的UI设计和流畅的交互动画；深色模式支持；完整的国际化支持；"
         "实时搜索建议和热门推荐")
    ]

    for title, desc in innovations:
        story.append(Paragraph(f"• {title}", ParagraphStyle(
            'InnovationTitle',
            parent=bullet_style,
            fontName=chinese_font,
            textColor=HexColor('#0f172a')
        )))
        story.append(Paragraph(desc, ParagraphStyle(
            'InnovationDesc',
            parent=bullet_style,
            leftIndent=30,
            textColor=HexColor('#475569'),
            fontName=chinese_font
        )))
        story.append(Spacer(1, 0.3*cm))

    story.append(Spacer(1, 0.5*cm))

    # 核心创新点
    story.append(Paragraph("核心技术亮点", heading1_style))

    highlights = [
        "<b>语义归一化</b>: 通过智能处理提取查询核心意图，提高缓存命中率",
        "<b>双语并行生成</b>: 同时生成中英文版本，提升全球化体验",
        "<b>渐进式缓存</b>: 从本地到服务器的多级缓存策略",
        "<b>安全设计</b>: 完善的输入验证和防护机制"
    ]
    for highlight in highlights:
        story.append(Paragraph(f"• {highlight}", bullet_style))

    story.append(Spacer(1, 1*cm))

    # 总结
    story.append(Paragraph("项目总结", heading1_style))
    story.append(Paragraph(
        "PSP项目展示了一个现代化的AI驱动的搜索应用，通过巧妙的技术架构设计和用户体验优化，"
        "成功解决了开发者寻找工具的痛点。该项目结合了最新的前端技术、云原生架构和人工智能技术，"
        "为开发者提供了一个高效、智能、易用的工具搜索平台。",
        normal_style
    ))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(
        "项目的核心优势在于其智能的自然语言处理能力、高性能的三级缓存系统、精美的用户界面设计，"
        "以及完善的成本控制机制。通过96%+的缓存命中率和73KB的优化打包大小，"
        "该项目在性能和用户体验方面都达到了业界领先水平。",
        normal_style
    ))

    # 构建PDF
    doc.build(story)
    print(f"✓ PDF已生成: {output_path}")
    return output_path

if __name__ == "__main__":
    create_project_summary()
