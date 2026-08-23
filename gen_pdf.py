#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 GUIDES JSON 生成 DoorGo 攻略包 PDF（report 布局，A4）。
用法：python gen_pdf.py <guides.json> <output.pdf>
"""
import sys, json
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.colors import HexColor
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, HRFlowable)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# 注册中文字体
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))

ACCENT = HexColor('#0B6E5C')
GOLD = HexColor('#C8A24B')
MUTED = HexColor('#666666')
BORDER = HexColor('#DDDDDD')

styles = getSampleStyleSheet()

def st(name, **kw):
    base = kw.pop('base', 'Normal')
    return ParagraphStyle(name, parent=styles[base], **kw)

S_COVER_TITLE = st('coverTitle', fontName='STSong-Light', fontSize=28, leading=38,
                   alignment=TA_CENTER, textColor=HexColor('#111111'))
S_COVER_SUB = st('coverSub', fontName='STSong-Light', fontSize=13, leading=20,
                 alignment=TA_CENTER, textColor=MUTED)
S_H1 = st('h1s', fontName='STSong-Light', fontSize=16, leading=22, textColor=ACCENT,
          spaceBefore=18, spaceAfter=10)
S_H2 = st('h2s', fontName='STSong-Light', fontSize=13, leading=18, textColor=HexColor('#111111'),
          spaceBefore=12, spaceAfter=6)
S_P = st('ps', fontName='STSong-Light', fontSize=10.5, leading=17, textColor=HexColor('#222222'),
         spaceAfter=6)
S_LI = st('lis', fontName='STSong-Light', fontSize=10.5, leading=17, textColor=HexColor('#222222'),
          spaceAfter=3, leftIndent=12)
S_TIP = st('tip', fontName='STSong-Light', fontSize=10.5, leading=17,
           textColor=HexColor('#FFFFFF'), backColor=ACCENT, borderPadding=8,
           spaceAfter=8, spaceBefore=4)
S_WARN = st('warn', fontName='STSong-Light', fontSize=10.5, leading=17,
            textColor=HexColor('#7A3B00'), backColor=HexColor('#FDECCE'), borderPadding=8,
            spaceAfter=8, spaceBefore=4)
S_INFO = st('info', fontName='STSong-Light', fontSize=10.5, leading=17,
            textColor=HexColor('#333333'), backColor=HexColor('#EAF3F1'), borderPadding=8,
            spaceAfter=8, spaceBefore=4)
S_TOC = st('toc', fontName='STSong-Light', fontSize=11, leading=20, textColor=HexColor('#222222'))

def esc(t):
    if t is None:
        return ''
    return t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def para(text, style):
    return Paragraph(text, style)

def block_to_flowables(b):
    t = b.get('type')
    if t == 'h2':
        return [para(esc(b['text']), S_H2)]
    if t == 'h3':
        return [para('<b>%s</b>' % esc(b['text']), S_H2)]
    if t == 'p':
        return [para(esc(b['text']), S_P)]
    if t == 'ul':
        return [para('• ' + esc(it), S_LI) for it in b.get('items', [])]
    if t == 'ol':
        return [para('%d. %s' % (i + 1, esc(it)), S_LI) for i, it in enumerate(b.get('items', []))]
    if t == 'tip':
        return [para('<b>💡 实用 Tips：</b>' + esc(b['text']), S_TIP)]
    if t == 'warn':
        return [para('<b>⚠️ 注意：</b>' + esc(b['text']), S_WARN)]
    if t == 'info':
        return [para('<b>ℹ️ 说明：</b>' + esc(b['text']), S_INFO)]
    if t == 'referral':
        return [para('<b>%s</b><br/>%s' % (esc(b.get('title', '🎁 推荐/邀请')), esc(b.get('text', ''))), S_INFO)]
    if t == 'buy':
        return [para('<b>💳 %s</b> · %s' % (esc(b.get('text', '')), esc(b.get('url', ''))), S_WARN)]
    if t == 'table':
        head = b.get('head', [])
        rows = b.get('rows', [])
        data = [[esc(c) for c in head]] + [[esc(c) for c in r] for r in rows]
        colw = max(2, int(16.7 / max(1, len(head))))
        tbl = Table(data, colWidths=[colw * cm] * len(head), repeatRows=1)
        tbl.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'STSong-Light'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('LEADING', (0, 0), (-1, -1), 13),
            ('BACKGROUND', (0, 0), (-1, 0), ACCENT),
            ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#FFFFFF')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#FFFFFF'), HexColor('#F4F7F6')]),
            ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        return [tbl, Spacer(1, 8)]
    return []

def main():
    guides_json, out_pdf = sys.argv[1], sys.argv[2]
    guides = json.load(open(guides_json, encoding='utf-8'))
    # 排序：account 在前，card 次之，refund（付费）最后
    order = {'account': 0, 'card': 1, 'refund': 2}
    guides = sorted(guides, key=lambda g: (order.get(g.get('cat'), 9), g.get('id', '')))

    doc = SimpleDocTemplate(out_pdf, pagesize=A4,
                            leftMargin=2.2 * cm, rightMargin=2.2 * cm,
                            topMargin=2.2 * cm, bottomMargin=2.2 * cm)
    story = []

    # 封面
    story.append(Spacer(1, 4 * cm))
    story.append(para('DoorGo', ParagraphStyle('logo', fontName='STSong-Light', fontSize=40,
                 leading=48, alignment=TA_CENTER, textColor=ACCENT)))
    story.append(Spacer(1, 1.2 * cm))
    story.append(para('港澳开户 · 香港信用卡', S_COVER_TITLE))
    story.append(Spacer(1, 0.5 * cm))
    story.append(para('完整实操攻略手册', S_COVER_TITLE))
    story.append(Spacer(1, 1.5 * cm))
    story.append(para('共 %d 篇深度攻略' % len(guides), S_COVER_SUB))
    story.append(para('整理自公开银行政策与真实用户案例 · 仅供科普参考', S_COVER_SUB))
    story.append(Spacer(1, 2.5 * cm))
    story.append(para('政策随时调整，最终以各银行官方为准', S_COVER_SUB))
    story.append(PageBreak())

    # 目录
    story.append(para('目录', S_H1))
    story.append(HRFlowable(width='100%', thickness=0.6, color=ACCENT))
    story.append(Spacer(1, 10))
    for i, g in enumerate(guides):
        story.append(para('%d. %s' % (i + 1, esc(g['title'])), S_TOC))
    story.append(PageBreak())

    # 正文
    for g in guides:
        story.append(para(esc(g['title']), S_H1))
        story.append(HRFlowable(width='100%', thickness=0.6, color=ACCENT))
        story.append(Spacer(1, 8))
        for b in g.get('content', []):
            story.extend(block_to_flowables(b))
        story.append(PageBreak())

    def footer(canvas, d):
        canvas.saveState()
        canvas.setFont('STSong-Light', 8)
        canvas.setFillColor(MUTED)
        canvas.drawCentredString(A4[0] / 2, 1.2 * cm, 'DoorGo · 港澳开户与信用卡攻略')
        canvas.drawRightString(A4[0] - 2.2 * cm, 1.2 * cm, '%d' % d.page)
        canvas.restoreState()

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print('OK ->', out_pdf)

if __name__ == '__main__':
    main()
