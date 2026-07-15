import { LocationCard } from "@/components/home/location-card";
import { LOCATIONS } from "@/lib/site-content";

export function LocationSection() {
  return (
    <section
      className="section section--light locations"
      id="location"
      aria-labelledby="location-title"
    >
      <div className="locations__inner">
        <header className="locations__header">
          <p className="eyebrow eyebrow--red">LOCATIONS</p>
          <h2 id="location-title">두 곳에서 만나요</h2>
          <p>
            가까운 왕징을 선택해 주소와 전화번호를 확인하고 네이버 플레이스로
            바로 이동하세요.
          </p>

          <nav className="location-jumps" aria-label="지점 바로가기">
            {LOCATIONS.map((location) => (
              <a
                className="location-jump"
                href={location.mapUrl}
                key={location.id}
                target="_blank"
                rel="noreferrer"
                aria-label={`${location.shortName} 네이버 플레이스 열기`}
              >
                <span aria-hidden="true" />
                {location.shortName}
              </a>
            ))}
          </nav>
        </header>

        <ul className="location-grid">
          {LOCATIONS.map((location) => (
            <li key={location.id}>
              <LocationCard location={location} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
