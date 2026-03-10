import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '利用規約 | カブノオト',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block"
        >
          ← ホームに戻る
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">利用規約</h1>

        <div className="space-y-8 leading-relaxed">
          {/* 1. はじめに */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. はじめに</h2>
            <p>
              本利用規約（以下「本規約」）は、カブノオト（以下「本サービス」）の利用に関する条件を定めるものです。
              ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
            </p>
          </section>

          {/* 2. サービスの内容 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. サービスの内容</h2>
            <p className="mb-3">
              本サービスは、ユーザー自身の投資に関する思考を整理・記録するためのツールです。
              具体的には、以下の機能を提供します。
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>銘柄情報の管理・メモ・タグ付け</li>
              <li>投資戦略・分析の記録</li>
              <li>保有ポジション・損益の記録・管理</li>
              <li>配当・株主優待情報の管理</li>
              <li>イベント・アラートの設定</li>
              <li>ポートフォリオの可視化</li>
            </ul>
          </section>

          {/* 3. 投資判断に関する重要な免責事項 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. 投資判断に関する重要な免責事項</h2>
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-300 font-semibold mb-2">重要</p>
              <p className="text-red-200">
                本サービスは、金融商品取引法に基づく投資助言業・投資運用業の登録を受けたサービスではありません。
                本サービスは投資助言、投資勧誘、売買推奨を一切行いません。
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2">
              <li>
                本サービスで提供される機能・表示は、ユーザー自身が入力したデータに基づくものであり、
                投資の成果を保証するものではありません。
              </li>
              <li>
                株式投資には元本割れを含むリスクがあります。
                投資に関する最終的な判断は、ユーザーご自身の責任において行ってください。
              </li>
              <li>
                本サービスの利用により生じた投資損失について、運営者は一切の責任を負いません。
              </li>
              <li>
                投資判断にあたっては、必要に応じて金融商品取引業者、税理士、
                その他の専門家にご相談ください。
              </li>
            </ul>
          </section>

          {/* 4. 情報の正確性 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. 情報の正確性</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                本サービスに表示される銘柄情報（銘柄コード・会社名・業種等）は、
                JPX（日本取引所グループ）の公開情報に基づいていますが、
                その正確性・最新性を保証するものではありません。
              </li>
              <li>
                株価情報はユーザーが手動で入力したデータであり、
                リアルタイムの市場価格を反映するものではありません。
              </li>
              <li>
                配当金・株主優待等の情報はユーザーが入力したものであり、
                実際の発表内容と異なる場合があります。
                正確な情報は各企業のIR情報等でご確認ください。
              </li>
              <li>
                損益計算・利回り計算等の数値は、ユーザーが入力したデータに基づく概算値であり、
                税金・手数料等を考慮した正確な数値ではない場合があります。
              </li>
            </ul>
          </section>

          {/* 5. アカウントの管理 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. アカウントの管理</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                ユーザーは、自身のアカウント情報を適切に管理する責任を負います。
              </li>
              <li>
                アカウントの不正利用があった場合、またはそのおそれがある場合は、
                速やかに運営者にご連絡ください。
              </li>
              <li>
                ユーザーのアカウントを通じて行われた操作は、
                当該ユーザーの操作とみなします。
              </li>
            </ul>
          </section>

          {/* 6. 禁止事項 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. 禁止事項</h2>
            <p className="mb-3">ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
            <ul className="list-disc list-inside space-y-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>他のユーザーまたは第三者の権利を侵害する行為</li>
              <li>不正アクセス、またはこれを試みる行為</li>
              <li>本サービスのシステムに過度の負荷をかける行為</li>
              <li>本サービスのソースコードのリバースエンジニアリング、逆コンパイル、逆アセンブルを行う行為</li>
              <li>本サービスを利用して第三者に投資助言を行う行為</li>
              <li>虚偽の情報を登録する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          {/* 7. データの取り扱い */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. データの取り扱い</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                ユーザーが入力したデータの所有権は、ユーザーに帰属します。
              </li>
              <li>
                運営者は、データの保存について合理的な注意を払いますが、
                データの消失・破損について一切の責任を負いません。
                重要なデータについては、ユーザー自身でバックアップを行ってください。
              </li>
              <li>
                アカウントを削除した場合、当該ユーザーの全データは完全に削除され、
                復元することはできません。
              </li>
            </ul>
          </section>

          {/* 8. 免責事項 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. 免責事項</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                本サービスは「現状有姿」で提供され、明示または黙示を問わず、
                いかなる種類の保証もありません。
              </li>
              <li>
                運営者は、本サービスの利用に起因または関連して生じた
                直接的・間接的な損害（投資損失、データ消失、逸失利益、
                機会損失等を含みますがこれらに限りません）について、
                一切の責任を負いません。
              </li>
              <li>
                システム障害、メンテナンス、天災、通信回線の障害等により、
                本サービスの提供が中断・停止した場合でも、
                運営者は一切の責任を負いません。
              </li>
              <li>
                運営者は、本サービスにバグ、エラー、中断がないことを保証しません。
              </li>
            </ul>
          </section>

          {/* 9. 損害賠償の制限 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. 損害賠償の制限</h2>
            <p>
              本サービスは無料で提供されるサービスです。
              万一、運営者の故意または重過失により損害が生じた場合であっても、
              運営者が負う損害賠償の範囲は、直接かつ現実に生じた通常の損害に限られるものとし、
              投資損失その他の間接的損害、特別損害、逸失利益は含まないものとします。
            </p>
          </section>

          {/* 10. サービスの変更・中断・終了 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. サービスの変更・中断・終了</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                運営者は、ユーザーへの事前の通知なく、本サービスの内容を変更、
                または機能の追加・削除を行うことができます。
              </li>
              <li>
                運営者は、以下のいずれかの場合に、本サービスの提供を一時的に中断することができます。
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                  <li>システムの保守・点検を行う場合</li>
                  <li>天災・停電等の不可抗力により提供が困難な場合</li>
                  <li>その他、運営上必要と判断した場合</li>
                </ul>
              </li>
              <li>
                運営者は、相当な予告期間を設けた上で、本サービスの全部または一部を終了することができます。
              </li>
            </ul>
          </section>

          {/* 11. ユーザーの利用停止・アカウント削除 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. ユーザーの利用停止・アカウント削除</h2>
            <p>
              運営者は、ユーザーが本規約に違反した場合、または本サービスの運営上必要と判断した場合、
              事前の通知なく当該ユーザーのアカウントを停止または削除することができます。
              この場合、運営者は当該措置によりユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>

          {/* 12. 知的財産権 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. 知的財産権</h2>
            <p>
              本サービスに関する著作権、商標権、その他の知的財産権は、
              運営者または正当な権利者に帰属します。
              ユーザーは、運営者の事前の書面による承諾なく、
              本サービスのコンテンツを複製、改変、頒布、公衆送信等することはできません。
            </p>
          </section>

          {/* 13. 準拠法・管轄 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. 準拠法・管轄</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>本規約は、日本法に準拠し、日本法に従って解釈されるものとします。</li>
              <li>
                本サービスに関連する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </li>
            </ul>
          </section>

          {/* 14. 規約の変更 */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">14. 規約の変更</h2>
            <p>
              運営者は、必要と判断した場合には、ユーザーに通知することなく本規約を変更できるものとします。
              変更後の利用規約は、本ページに掲載した時点で効力を生じるものとし、
              ユーザーが変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。
            </p>
          </section>

          {/* 15. お問い合わせ */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">15. お問い合わせ</h2>
            <p>
              本規約に関するお問い合わせは、下記までご連絡ください。
            </p>
            <p className="mt-2">連絡先: [メールアドレス]</p>
          </section>

          {/* 制定日 */}
          <section className="pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">制定日: 2026年3月10日</p>
          </section>
        </div>

        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 text-sm mt-8 inline-block"
        >
          ← ホームに戻る
        </Link>
      </div>
    </div>
  )
}
