import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Enhanced observability',
    Svg: require('@site/static/img/observability.svg').default,
    description: (
      <>
        Intercept and <i>Observe</i> the input outputs of any API automatically
        without needing to modify the original source code.
      </>
    ),
  },
  {
    title: 'Enhanced controlibility',
    Svg: require('@site/static/img/control.svg').default,
    description: (
      <>
        Intercept and <i>Control</i> the behavior of any API automatically
        without modifiying the original source code.
      </>
    ),
  },
  {
    title: 'Layered Architecture',
    Svg: require('@site/static/img/layered.svg').default,
    description: (
      <>
        Separated packages for each feature to simplify
        usage and maximize testability.
      </>
    ),
  },
  {
    title: 'High performance',
    Svg: require('@site/static/img/performance.svg').default,
    description: (
      <>
        Highest performance (JIT friendly, tree-shaking friendly)
      </>
    )
  },
  {
    title: 'Browser DOM interception',
    Svg: require('@site/static/img/cross-browser.svg').default,
    description: (
      <>
        Cross browser DOM API interception, handling deep & inconstent
        prototype chains in browsers.
      </>
    )
  },
  {
    title: 'Type Safety for scale',
    Svg: require('@site/static/img/safety.svg').default,
    description: (
      <>
        Fully typesafe API interception, enabling safe ussage
        and modification of behavior.
      </>
    )
  },


];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
