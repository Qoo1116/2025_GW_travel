// script.js
document.addEventListener('DOMContentLoaded', () => {

    // 1. タイトル同期
    const mainTitle = document.querySelector('h1');
    if (mainTitle) {
        document.title = mainTitle.textContent.trim();
    }

    // 2. 動的アイコン
    const emojiMap = {
        '1': '📝', '①': '📝', // サマリー
        '2': '📅', '②': '📅', // タイムテーブル
        '2.1': '🚗', '2.2': '🧱', '2.3': '🐬', // 日別
        '3': '🚦', '③': '🚦', // 混雑・渋滞
        '3.1': '🛣️', '3.2': '🚶', '3.3': '🅿️', '3.4': '💡', // 混雑詳細
        '4': '🍽️', '④': '🍽️', // 飲食
        '5': '💡', '⑤': '💡', // Tips
        '5.1': '👶', '5.2': '⏩', '5.3': '🎭', '5.4': '📱', '5.5': '👯', '5.6': '💰', '5.7': '📌', // Tips詳細
        '6': '☔', '⑥': '☔', // 雨天
        '6.1': '🌦️', '6.2': '🏰', '6.3': '🧱', '6.4': '🚶', '6.5': '🏠', // 雨天詳細
        '7': '📚', '⑦': '📚', // 参考情報
    };

    document.querySelectorAll('h1, h2, h3').forEach((heading, index) => {
        const headingText = heading.textContent.trim();
        // マッチする可能性のあるパターン: "1. ", "① ", "3.2. "
        const match = headingText.match(/^([①-⑦]|[1-9](?:\.[1-9]){0,2})\.?\s*/);
        let icon = '🔹'; // デフォルトアイコン
        if (match) {
            const num = match[1];
            icon = emojiMap[num] || '🔹';
        }
        heading.setAttribute('data-icon', icon);

        // 目次生成のためのID付与 (より堅牢なID生成)
        if (!heading.id) {
            const level = parseInt(heading.tagName.substring(1));
            // テキストからID生成 (記号を除去し、スペースをハイフンに)
            let baseId = heading.textContent.trim()
                .replace(/^([①-⑦]|[1-9](?:\.[1-9]){0,2})\.?\s*/, '') // 番号除去
                .toLowerCase()
                .replace(/[^\w\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\- ]+/g, '') // 英数カナ漢字ハイフンスペース以外除去
                .replace(/\s+/g, '-') // スペースをハイフンに
                .substring(0, 50); // 長すぎる場合に切り詰める

            // 親セクションIDをプレフィックスとして追加（レベル2以上）
             let prefix = 'section';
             if (level > 1) {
                 const parentSection = heading.closest('section[id^="section-"]');
                 if (parentSection) {
                     prefix = parentSection.id;
                 }
             }
            baseId = `${prefix}-h${level}-${baseId || index}`; // テキストが空ならインデックス使用

            // ユニークなIDを保証
            let uniqueId = baseId;
            let counter = 1;
            while (document.getElementById(uniqueId)) {
                uniqueId = `${baseId}-${counter++}`;
            }
            heading.id = uniqueId;
        }
    });

    // 3. 目次自動生成
    const tocDrawer = document.getElementById('tocDrawer');
    const tocListContainer = document.createElement('ul');
    const headings = document.querySelectorAll('main h1, main h2, main h3'); // main内の見出しのみ対象

    if (headings.length > 0 && tocDrawer) { // 見出しと目次コンテナが存在する場合のみ実行
        let currentLevel1 = null;
        let currentLevel2 = null;
        let currentLists = [tocListContainer]; // 現在の階層のul要素を管理するスタック

        const ensureMinItems = (list, minCount) => {
            if (!list) return; // listがnullなら何もしない
            const currentItems = list.children.length;
            if (currentItems < minCount) {
                for (let i = 0; i < minCount - currentItems; i++) {
                    const placeholderLi = document.createElement('li');
                    placeholderLi.classList.add('placeholder');
                    const placeholderA = document.createElement('a');
                    placeholderA.textContent = "補足";
                    placeholderA.href = "#"; // リンクは不要だが形式上
                    placeholderLi.appendChild(placeholderA);
                    list.appendChild(placeholderLi);
                }
            }
        };

        headings.forEach((heading) => {
            const level = parseInt(heading.tagName.substring(1));
            const li = document.createElement('li');
            const a = document.createElement('a');
            // 見出しテキストから番号部分を除去してリンクテキストに設定
            a.textContent = heading.textContent.trim().replace(/^([①-⑦]|[1-9](?:\.[1-9]){0,2})\.?\s*/, '');
            a.href = `#${heading.id}`;

            // スムーズスクロールとドロワーを閉じる
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const targetElement = document.getElementById(heading.id);
                if(targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
                // ドロワーが開いていれば閉じる
                if (tocDrawer.classList.contains('open')) {
                     tocDrawer.classList.remove('open');
                }
            });

            li.appendChild(a);

            // 階層構造を構築
            while (level < currentLists.length) {
                 // 現在の階層より浅い場合は、前の階層のリストを最低2件チェックしてスタックからpop
                 const finishedList = currentLists[currentLists.length - 1];
                 ensureMinItems(finishedList, 2);
                 currentLists.pop();
            }
            if (level > currentLists.length) {
                 // 現在の階層より深い場合は、新しいulを作成してスタックにpush
                 const newUl = document.createElement('ul');
                 // 前のli要素 (currentLists.length-1 の最後の li) に新しいulを追加
                 const parentLi = currentLists[currentLists.length - 1].lastElementChild;
                 if (parentLi) { // 親liが存在する場合のみ追加
                     parentLi.appendChild(newUl);
                     currentLists.push(newUl);
                 } else {
                     // 親liがない異常ケース（通常は発生しないはず）
                     console.warn("Could not find parent li for level", level, heading.textContent);
                     currentLists[currentLists.length - 1].appendChild(li); // とりあえず現在のリストに追加
                     return; // この見出しは処理中断
                 }
            }

            // 現在の階層のulにliを追加
            currentLists[currentLists.length - 1].appendChild(li);
        });

        // ループ終了後、最後の階層のリストも最低2件チェック
        while (currentLists.length > 1) {
             const finishedList = currentLists[currentLists.length - 1];
             ensureMinItems(finishedList, 2);
             currentLists.pop();
        }
         ensureMinItems(tocListContainer, 2); // ルートレベルもチェック

        tocDrawer.appendChild(tocListContainer);
    } else if (tocDrawer) {
         // 見出しが見つからない場合のメッセージ
         const noHeadingsMsg = document.createElement('p');
         noHeadingsMsg.textContent = '目次項目が見つかりませんでした。';
         noHeadingsMsg.style.padding = '10px';
         tocDrawer.appendChild(noHeadingsMsg);
    }


    // 目次トグルボタンのイベントリスナー
    const tocToggle = document.querySelector('.toc-toggle');
    if (tocToggle && tocDrawer) {
        tocToggle.addEventListener('click', (e) => {
             e.stopPropagation(); // ドキュメントへの伝播を防ぐ
            tocDrawer.classList.toggle('open');
        });
         // ドロワー外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (tocDrawer.classList.contains('open') && !tocDrawer.contains(e.target) && !tocToggle.contains(e.target)) {
                tocDrawer.classList.remove('open');
            }
        });
    }


    // 4. IntersectionObserver で TOC ハイライト
    const tocLinks = tocDrawer ? tocDrawer.querySelectorAll('a:not(.placeholder a)') : []; // プレースホルダ除く
    if (IntersectionObserver && headings.length > 0 && tocLinks.length > 0) {
        const observerOptions = {
            rootMargin: '-15% 0px -75% 0px', // 画面の上部15%～下部25%の間で見出しを検出 (少し調整)
            threshold: 0
        };

        let lastActiveLink = null; // 最後のアクティブリンクを追跡

        const observerCallback = (entries) => {
            let intersectingEntry = null;

            entries.forEach(entry => {
                 if (entry.isIntersecting) {
                    // 複数のエントリーが交差する場合、最も画面上部にあるものを優先
                    if (!intersectingEntry || entry.boundingClientRect.top < intersectingEntry.boundingClientRect.top) {
                         intersectingEntry = entry;
                    }
                 }
            });

             // 他のアクティブを解除
             tocLinks.forEach(link => link.classList.remove('active'));

             if (intersectingEntry) {
                 const id = intersectingEntry.target.getAttribute('id');
                 const correspondingLink = tocDrawer.querySelector(`a[href="#${id}"]`);
                 if (correspondingLink) {
                     correspondingLink.classList.add('active');
                     lastActiveLink = correspondingLink; // 最後のアクティブを更新
                 }
             } else if (lastActiveLink) {
                 // 交差しているものがなくても、スクロール方向によっては前回のアクティブを維持
                 // (画面外に完全に出るまでは維持するような挙動)
                 // 必要なら、ここにスクロール方向に基づくロジックを追加
                 lastActiveLink.classList.add('active'); // 暫定的に維持
             }
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        headings.forEach(heading => observer.observe(heading));
    }

    // 5. トップへ戻るボタン
    const toTopButton = document.getElementById('toTop');
    if (toTopButton) {
        let isVisible = false;
        const checkScroll = () => {
            if (window.scrollY > 300 && !isVisible) {
                toTopButton.classList.add('visible');
                isVisible = true;
            } else if (window.scrollY <= 300 && isVisible) {
                toTopButton.classList.remove('visible');
                isVisible = false;
            }
        };
        window.addEventListener('scroll', checkScroll);
        checkScroll(); // 初期表示チェック
        toTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 6. 出典整形
    const cleanUrl = (url) => {
        try {
             // URLデコード -> 不正文字除去 -> URLエンコード
             let decodedUrl = decodeURI(url);
             // 制御文字や特定の不正文字を除去（例）
             decodedUrl = decodedUrl.replace(/[\x00-\x1F\x7F<>]/g, '');
             return encodeURI(decodedUrl).replace(/#/g, '%23'); // #もエンコード
        } catch (e) {
             console.warn(`URL cleaning/encoding failed for: ${url}`, e);
             // フォールバック: 単純なencodeURI
             try {
                 return encodeURI(url).replace(/#/g, '%23');
             } catch {
                 return url; // それでもだめならそのまま
             }
        }
    };

    document.querySelectorAll('.refs').forEach(refsList => {
        const items = Array.from(refsList.querySelectorAll('li')); // NodeListをArrayに変換
        items.forEach((item) => {
            const text = item.textContent.trim();
            // フォーマット: 《番号》 URL｜サイト名｜日付 (URLに|が含まれる場合も考慮)
            const match = text.match(/^《(\d+)》\s*(.*?)\s*｜\s*(.*?)\s*｜\s*(.*?)\s*$/);
            if (match) {
                const num = match[1];
                const url = match[2].trim();
                const siteName = match[3].trim();
                const date = match[4].trim();

                if (!url || !siteName) {
                     console.warn("出典情報が不足しています:", text);
                     item.innerHTML = `[${num}] 情報不足`; // 不足情報を表示
                     item.id = `ref-${num}`; // IDは設定
                     return; // この項目はスキップ
                }

                const cleanHref = cleanUrl(url);

                item.innerHTML = ''; // 内容をクリア
                item.id = `ref-${num}`; // ID付与 (本文からのリンク用)

                const span = document.createElement('span');
                span.textContent = `[${num}] ${siteName} (${date}): `;
                item.appendChild(span);

                const link = document.createElement('a');
                link.href = cleanHref;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = '詳細はこちら';
                item.appendChild(link);

                // 本文中の対応するsupを探してアンカーを設定
                 // NodeListではなくリアルタイムで探索する方が確実な場合も
                document.querySelectorAll(`sup`).forEach(sup => {
                    // sup内のテキストが《番号》形式かチェック
                    const supMatch = sup.textContent.trim().match(/^《(\d+)》$/);
                    if (supMatch && supMatch[1] === num) {
                        // 既にaタグでラップされていないか確認
                        if (!sup.querySelector('a')) {
                            const supLink = document.createElement('a');
                            supLink.href = `#ref-${num}`;
                            // 《》も含めてリンクテキストにする
                            supLink.textContent = sup.textContent.trim();
                            sup.textContent = ''; // 元のテキストをクリア
                            sup.appendChild(supLink);
                        }
                    }
                });

            } else if (text) { // 空のliは無視
                console.warn("出典フォーマットが不正です:", text);
                 // 不正フォーマットの場合も番号だけ抽出を試みる
                 const numMatch = text.match(/^《(\d+)》/);
                 if (numMatch) {
                     item.id = `ref-${numMatch[1]}`;
                     item.innerHTML = `[${numMatch[1]}] ${item.innerHTML}`; // 番号だけ頭につける
                 }
            } else {
                 // 空のli要素は削除するなどの処理も可能
                 item.remove();
            }
        });
    });

    // スマホ用テーブルヘッダー設定 (data-label) - 横スクロール化に伴い不要に
    /*
    const setupTableLabels = () => {
         if (window.innerWidth <= 600) {
             // ... (省略) ...
         } else {
              // ... (省略) ...
         }
    };
    setupTableLabels(); // 初期実行
    window.addEventListener('resize', setupTableLabels); // リサイズ時にも実行
    */

});