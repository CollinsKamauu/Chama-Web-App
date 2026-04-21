const mpesaUrl = new URL('../assets/auth/Money Transfer Web Enhanced.svg', import.meta.url).href
const mobileTransferUrl = new URL('../assets/auth/Mobile-Transfer.svg', import.meta.url).href
const fileRecordUrl = new URL('../assets/auth/Record Icon.svg', import.meta.url).href
const exportUrl = new URL('../assets/auth/Data Export Web Enhanced.svg', import.meta.url).href

/** Shared marketing hero for login and signup (desktop). */
export default function AuthHeroFeatures() {
  return (
    <aside className="authHero" aria-label="Product features">
      <h2 className="authHeroTitle">The easiest way to manage your Chama</h2>
      <div className="authFeature">
        <img className="authFeatureIcon" src={mpesaUrl} alt="" />
        <p className="authFeatureText">M-Pesa Paybill and Till Automation</p>
      </div>
      <div className="authFeature">
        <img className="authFeatureIcon" src={mobileTransferUrl} alt="" />
        <p className="authFeatureText">Send Money directly to members</p>
      </div>
      <div className="authFeature">
        <img className="authFeatureIcon" src={fileRecordUrl} alt="" />
        <p className="authFeatureText">Record transactions</p>
      </div>
      <div className="authFeature">
        <img className="authFeatureIcon" src={exportUrl} alt="" />
        <p className="authFeatureText">Manage and export records</p>
      </div>
    </aside>
  )
}
