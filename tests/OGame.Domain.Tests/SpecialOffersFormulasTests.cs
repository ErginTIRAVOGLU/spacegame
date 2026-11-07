using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class SpecialOffersFormulasTests
{
    [Fact]
    public void CalculateDiscountPrice_ShouldCalculateCorrectly()
    {
        // 20% off 500,000 = 400,000
        Assert.Equal(400_000, SpecialOffersFormulas.CalculateDiscountPrice(500_000, 20));

        // 50% off 240,000 = 120,000
        Assert.Equal(120_000, SpecialOffersFormulas.CalculateDiscountPrice(240_000, 50));

        // 30% off 120,000 = 84,000
        Assert.Equal(84_000, SpecialOffersFormulas.CalculateDiscountPrice(120_000, 30));

        // 25% off 750 = 562
        Assert.Equal(562, SpecialOffersFormulas.CalculateDiscountPrice(750, 25));

        // 20% off 300,000 (Platinum 90d booster) = 240,000
        Assert.Equal(240_000, SpecialOffersFormulas.CalculateDiscountPrice(300_000, 20));
    }

    [Fact]
    public void GetBundles_ShouldContainExactlyThreeCompositeBundles()
    {
        var bundles = SpecialOffersFormulas.GetBundles();

        Assert.NotNull(bundles);
        Assert.Equal(3, bundles.Count);

        var explorer = SpecialOffersFormulas.FindBundle("bundle_explorer");
        var industrialist = SpecialOffersFormulas.FindBundle("bundle_industrialist");
        var lifeform = SpecialOffersFormulas.FindBundle("bundle_lifeform");

        Assert.NotNull(explorer);
        Assert.Equal(125_000, explorer.BundlePriceDarkMatter);
        Assert.Equal(170_000, explorer.OriginalValueDarkMatter);
        Assert.NotEmpty(explorer.ItemsIncluded);

        Assert.NotNull(industrialist);
        Assert.Equal(290_000, industrialist.BundlePriceDarkMatter);
        Assert.Equal(390_000, industrialist.OriginalValueDarkMatter);
        Assert.NotEmpty(industrialist.ItemsIncluded);

        Assert.NotNull(lifeform);
        Assert.Equal(75_000, lifeform.BundlePriceDarkMatter);
        Assert.Equal(110_000, lifeform.OriginalValueDarkMatter);
        Assert.NotEmpty(lifeform.ItemsIncluded);
    }
}

