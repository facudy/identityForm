// 直接导入JSON文件
import regionDataJson from './china-regions.json';

export interface RegionOption {
  value: string;
  label: string;
  children?: RegionOption[];
}

// 类型断言来处理JSON数据
const regionData = regionDataJson as { [key: string]: { [key: string]: string[] } };

// 从JSON数据转换为Cascader需要的格式
function transformRegionData(): RegionOption[] {
  const provinces: RegionOption[] = [];

  Object.keys(regionData).forEach((provinceName, provinceIndex) => {
    const provinceData = regionData[provinceName];
    const cities: RegionOption[] = [];

    // 遍历省份下的城市
    Object.keys(provinceData).forEach((cityName, cityIndex) => {
      const districts = provinceData[cityName];
      const districtOptions: RegionOption[] = [];

      // 遍历城市下的区县
      if (Array.isArray(districts)) {
        districts.forEach((districtName, districtIndex) => {
          districtOptions.push({
            value: `${provinceIndex}-${cityIndex}-${districtIndex}`,
            label: districtName
          });
        });
      }

      cities.push({
        value: `${provinceIndex}-${cityIndex}`,
        label: cityName,
        children: districtOptions
      });
    });

    provinces.push({
      value: `${provinceIndex}`,
      label: provinceName,
      children: cities
    });
  });

  return provinces;
}

export const transformedRegionData: RegionOption[] = transformRegionData();

// 根据编码获取地区名称的辅助函数
export function getRegionNameByCode(codes: string[]): string {
  if (!codes || codes.length === 0) return '';

  const names: string[] = [];

  try {
    const provinceIndex = parseInt(codes[0]);
    const cityIndex = codes[1] ? parseInt(codes[1].split('-')[1]) : -1;
    const districtIndex = codes[2] ? parseInt(codes[2].split('-')[2]) : -1;

    const provinceNames = Object.keys(regionData);

    // 获取省份名称
    if (provinceIndex >= 0 && provinceIndex < provinceNames.length) {
      const provinceName = provinceNames[provinceIndex];
      names.push(provinceName);

      // 获取城市名称
      if (cityIndex >= 0) {
        const provinceData = regionData[provinceName];
        const cityNames = Object.keys(provinceData);

        if (cityIndex < cityNames.length) {
          const cityName = cityNames[cityIndex];
          names.push(cityName);

          // 获取区县名称
          if (districtIndex >= 0) {
            const districts = provinceData[cityName];
            if (Array.isArray(districts) && districtIndex < districts.length) {
              names.push(districts[districtIndex]);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('获取地区名称失败:', error);
  }

  return names.join(' ');
}

// 根据编码获取完整地区信息的辅助函数
export function getRegionDetailByCode(codes: string[]): {
  province: string;
  city: string;
  district: string;
} {
  const result = {
    province: '',
    city: '',
    district: ''
  };

  if (!codes || codes.length === 0) return result;

  try {
    const provinceIndex = parseInt(codes[0]);
    const cityIndex = codes[1] ? parseInt(codes[1].split('-')[1]) : -1;
    const districtIndex = codes[2] ? parseInt(codes[2].split('-')[2]) : -1;

    const provinceNames = Object.keys(regionData);

    // 获取省份
    if (provinceIndex >= 0 && provinceIndex < provinceNames.length) {
      result.province = provinceNames[provinceIndex];

      // 获取城市
      if (cityIndex >= 0) {
        const provinceData = regionData[result.province];
        const cityNames = Object.keys(provinceData);

        if (cityIndex < cityNames.length) {
          result.city = cityNames[cityIndex];

          // 获取区县
          if (districtIndex >= 0) {
            const districts = provinceData[result.city];
            if (Array.isArray(districts) && districtIndex < districts.length) {
              result.district = districts[districtIndex];
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('获取地区详情失败:', error);
  }

  return result;
}